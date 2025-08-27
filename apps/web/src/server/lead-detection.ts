import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { logger } from '@/lib/logger';

export interface LeadDetectionResult {
  isLead: boolean;
  confidence: number;
  reason: string;
  suggestedActions: string[];
  extractedInfo?: {
    contactName?: string;
    contactEmail?: string;
    company?: string;
    phoneNumber?: string;
    propertyAddress?: string;
    propertyValue?: number;
    dealValue?: number;
    priority?: 'low' | 'medium' | 'high';
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface NotificationPayload {
  type: 'lead_detected' | 'follow_up_needed' | 'hot_lead';
  leadId?: string;
  threadId?: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

let openaiInstance: any = null;

async function getOpenAI() {
  if (!openaiInstance && process.env.OPENAI_API_KEY) {
    const OpenAI = (await import('openai')).default;
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export class LeadDetectionService {
  
  /**
   * Analyze an email message for lead potential using AI
   */
  async analyzeMessageForLead(
    orgId: string, 
    messageId: string, 
    threadId: string
  ): Promise<LeadDetectionResult> {
    try {
      // Get the message details with decrypted content
      const message = await this.getDecryptedMessage(orgId, messageId);
      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      // Build AI prompt for lead detection
      const analysisPrompt = this.buildLeadAnalysisPrompt(
        message.subject,
        message.body,
        message.from,
        message.to
      );

      // Use OpenAI for lead analysis
      const openai = await getOpenAI();
      if (!openai) {
        logger.warn('OpenAI not configured, falling back to keyword detection', {
          orgId,
          messageId,
          threadId
        });
        
        // Fallback to keyword-based analysis
        const keywordResult = this.fallbackLeadDetection(message.subject + ' ' + message.body);
        return keywordResult;
      }

      let aiResponse = '';
      
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert real estate lead detection system. Analyze emails to identify potential leads and extract relevant information.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        });

        aiResponse = completion.choices[0]?.message?.content || '';
      } catch (openaiError) {
        logger.warn('OpenAI API call failed, falling back to keyword detection', {
          orgId,
          messageId,
          threadId,
          error: openaiError instanceof Error ? openaiError.message : String(openaiError)
        });
        
        // Fallback to keyword-based analysis
        return this.fallbackLeadDetection(message.subject + ' ' + message.body);
      }

      // Parse AI response to extract lead detection result
      const result = this.parseAILeadResponse(aiResponse);

      logger.info('Lead analysis completed', {
        orgId,
        messageId,
        threadId,
        isLead: result.isLead,
        confidence: result.confidence,
        action: 'lead_analysis_complete'
      });

      return result;

    } catch (error) {
      logger.error('Lead analysis failed', {
        orgId,
        messageId,
        threadId,
        error: error instanceof Error ? error.message : String(error),
        action: 'lead_analysis_failed'
      });

      return {
        isLead: false,
        confidence: 0,
        reason: 'Analysis failed due to system error',
        suggestedActions: []
      };
    }
  }

  /**
   * Process a new email thread for lead detection
   */
  async processEmailThread(orgId: string, threadId: string): Promise<void> {
    try {
      // Get the most recent message in the thread
      const recentMessage = await prisma.emailMessage.findFirst({
        where: { 
          orgId,
          threadId 
        },
        orderBy: { sentAt: 'desc' },
        include: {
          thread: true
        }
      });

      if (!recentMessage) {
        logger.warn('No messages found in thread', {
          orgId,
          threadId,
          action: 'thread_processing_skipped'
        });
        return;
      }

      // Skip if thread already has an associated lead
      if (recentMessage.thread.leadId) {
        logger.info('Thread already has associated lead', {
          orgId,
          threadId,
          leadId: recentMessage.thread.leadId,
          action: 'thread_processing_skipped'
        });
        return;
      }

      // Analyze the message for lead potential
      const leadResult = await this.analyzeMessageForLead(
        orgId,
        recentMessage.id,
        threadId
      );

      // If it's a potential lead, create the lead and send notification
      if (leadResult.isLead && leadResult.confidence > 0.6) {
        const leadId = await this.createLeadFromEmail(
          orgId,
          threadId,
          recentMessage.id,
          leadResult
        );

        // Send notification about new lead
        await this.sendLeadNotification(orgId, {
          type: 'lead_detected',
          leadId,
          threadId,
          title: 'New Lead Detected',
          message: `AI detected a potential lead: ${leadResult.reason}`,
          priority: leadResult.confidence > 0.8 ? 'high' : 'medium',
          actionUrl: `/leads/${leadId}`
        });

        logger.info('Lead created from email', {
          orgId,
          threadId,
          leadId,
          confidence: leadResult.confidence,
          action: 'lead_created_from_email'
        });
      } else {
        logger.info('Email not flagged as lead', {
          orgId,
          threadId,
          confidence: leadResult.confidence,
          reason: leadResult.reason,
          action: 'email_not_flagged'
        });
      }

    } catch (error) {
      logger.error('Email thread processing failed', {
        orgId,
        threadId,
        error: error instanceof Error ? error.message : String(error),
        action: 'thread_processing_failed'
      });
    }
  }

  /**
   * Create a lead from an email with extracted information
   */
  async createLeadFromEmail(
    orgId: string,
    threadId: string,
    messageId: string,
    detectionResult: LeadDetectionResult
  ): Promise<string> {
    const message = await this.getDecryptedMessage(orgId, messageId);
    if (!message) {
      throw new Error('Message not found for lead creation');
    }

    // Extract or create contact information
    let contactId: string | undefined;
    if (detectionResult.extractedInfo) {
      contactId = await this.createOrUpdateContact(orgId, detectionResult.extractedInfo);
    }

    // Get default pipeline stage (first stage)
    const defaultStage = await prisma.pipelineStage.findFirst({
      where: { orgId },
      orderBy: { order: 'asc' }
    });

    // Create the lead
    const leadData = {
      orgId,
      contactId,
      stageId: defaultStage?.id,
      title: detectionResult.extractedInfo?.company 
        ? `Lead from ${detectionResult.extractedInfo.company}`
        : `Email Lead - ${message.subject}`,
      source: 'email_detection',
      status: 'active',
      priority: detectionResult.extractedInfo?.priority || 'medium',
      sourceThreadId: threadId,
      propertyAddress: detectionResult.extractedInfo?.propertyAddress,
      propertyValue: detectionResult.extractedInfo?.propertyValue,
      dealValueEnc: detectionResult.extractedInfo?.dealValue 
        ? await encryptForOrg(orgId, String(detectionResult.extractedInfo.dealValue), 'lead:deal_value')
        : null,
      notesEnc: await encryptForOrg(
        orgId, 
        `AI-detected lead:\n${detectionResult.reason}\n\nOriginal email subject: ${message.subject}`,
        'lead:notes'
      )
    };

    const lead = await prisma.lead.create({ data: leadData });

    // Link the thread to the lead
    await prisma.emailThread.update({
      where: { id: threadId },
      data: { leadId: lead.id }
    });

    // Create initial follow-up task
    await this.createFollowUpTask(orgId, lead.id, detectionResult.suggestedActions);

    return lead.id;
  }

  /**
   * Create or update contact from extracted information
   */
  private async createOrUpdateContact(
    orgId: string,
    extractedInfo: NonNullable<LeadDetectionResult['extractedInfo']>
  ): Promise<string | undefined> {
    if (!extractedInfo.contactEmail && !extractedInfo.contactName) {
      return undefined;
    }

    // Check if contact already exists
    let existingContact = null;
    if (extractedInfo.contactEmail) {
      // We need to search by encrypted email, so we'll need to encrypt the search term
      const emailToSearch = await encryptForOrg(orgId, extractedInfo.contactEmail, 'contact:email');
      existingContact = await prisma.contact.findFirst({
        where: {
          orgId,
          emailEnc: emailToSearch
        }
      });
    }

    if (existingContact) {
      return existingContact.id;
    }

    // Create new contact
    const contactData = {
      orgId,
      nameEnc: extractedInfo.contactName 
        ? await encryptForOrg(orgId, extractedInfo.contactName, 'contact:name')
        : null,
      emailEnc: extractedInfo.contactEmail 
        ? await encryptForOrg(orgId, extractedInfo.contactEmail, 'contact:email')
        : null,
      companyEnc: extractedInfo.company 
        ? await encryptForOrg(orgId, extractedInfo.company, 'contact:company')
        : null,
      phoneEnc: extractedInfo.phoneNumber 
        ? await encryptForOrg(orgId, extractedInfo.phoneNumber, 'contact:phone')
        : null
    };

    const contact = await prisma.contact.create({ data: contactData });
    return contact.id;
  }

  /**
   * Create follow-up task from suggested actions
   */
  private async createFollowUpTask(
    orgId: string,
    leadId: string,
    suggestedActions: string[]
  ): Promise<void> {
    if (suggestedActions.length === 0) {
      return;
    }

    const taskDescription = `Follow up on AI-detected lead:\n${suggestedActions.join('\n')}`;
    
    await prisma.task.create({
      data: {
        orgId,
        leadId,
        title: 'Follow up on new lead',
        descriptionEnc: await encryptForOrg(orgId, taskDescription, 'task:description'),
        status: 'pending',
        priority: 'medium',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due in 24 hours
      }
    });
  }

  /**
   * Send notification about lead detection
   */
  async sendLeadNotification(
    orgId: string,
    notification: NotificationPayload
  ): Promise<void> {
    try {
      // Get organization members to notify
      const orgMembers = await prisma.orgMember.findMany({
        where: { orgId },
        include: { user: true }
      });

      for (const member of orgMembers) {
        await prisma.notification.create({
          data: {
            orgId,
            userId: member.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            actionUrl: notification.actionUrl,
            metadata: {
              leadId: notification.leadId,
              threadId: notification.threadId
            }
          }
        });
      }

      logger.info('Lead notification sent', {
        orgId,
        type: notification.type,
        recipientCount: orgMembers.length,
        action: 'notification_sent'
      });

    } catch (error) {
      logger.error('Failed to send lead notification', {
        orgId,
        notification: notification.type,
        error: error instanceof Error ? error.message : String(error),
        action: 'notification_failed'
      });
    }
  }

  /**
   * Get decrypted message content
   */
  private async getDecryptedMessage(
    orgId: string,
    messageId: string
  ): Promise<{
    id: string;
    subject: string;
    body: string;
    from: string;
    to: string;
  } | null> {
    const message = await prisma.emailMessage.findFirst({
      where: { id: messageId, orgId }
    });

    if (!message) return null;

    try {
      const [subject, bodyData, from, to] = await Promise.all([
        message.subjectEnc ? decryptForOrg(orgId, message.subjectEnc as unknown as Buffer, 'email:subject') : Buffer.from(''),
        message.bodyRefEnc ? decryptForOrg(orgId, message.bodyRefEnc as unknown as Buffer, 'email:body') : Buffer.from(''),
        message.fromEnc ? decryptForOrg(orgId, message.fromEnc as unknown as Buffer, 'email:from') : Buffer.from(''),
        message.toEnc ? decryptForOrg(orgId, message.toEnc as unknown as Buffer, 'email:to') : Buffer.from('')
      ]);

      // Parse body content - it might be JSON structured
      let body = new TextDecoder().decode(bodyData);
      try {
        const parsedBody = JSON.parse(body);
        if (parsedBody.content) {
          body = parsedBody.content;
        } else if (parsedBody.type && parsedBody.content !== undefined) {
          body = parsedBody.content;
        }
      } catch {
        // If JSON parsing fails, use raw body content
      }

      return {
        id: message.id,
        subject: new TextDecoder().decode(subject),
        body: body,
        from: new TextDecoder().decode(from),
        to: new TextDecoder().decode(to)
      };
    } catch (error) {
      logger.error('Failed to decrypt message', {
        orgId,
        messageId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Build AI prompt for lead analysis
   */
  private buildLeadAnalysisPrompt(
    subject: string,
    body: string,
    from: string,
    to: string
  ): string {
    return `Analyze this email for potential real estate lead opportunities:

SUBJECT: ${subject}
FROM: ${from}
TO: ${to}

BODY:
${body}

Please analyze this email and respond with a JSON object containing:
{
  "isLead": boolean,
  "confidence": number (0-1),
  "reason": "detailed explanation",
  "suggestedActions": ["action1", "action2"],
  "extractedInfo": {
    "contactName": "extracted name or null",
    "contactEmail": "extracted email or null", 
    "company": "company name or null",
    "phoneNumber": "phone number or null",
    "propertyAddress": "property address or null",
    "propertyValue": number or null,
    "dealValue": number or null,
    "priority": "low|medium|high",
    "urgency": "low|medium|high"
  }
}

Look for indicators such as:
- Interest in buying/selling real estate
- Property inquiries
- Investment opportunities
- Real estate services requests
- Property valuations
- Market research requests
- Referrals or recommendations

Consider confidence levels:
- 0.9-1.0: Very clear buying/selling intent
- 0.7-0.8: Strong interest with specific details
- 0.5-0.6: General interest or inquiry
- 0.3-0.4: Weak signals
- 0.0-0.2: Not a lead`;
  }

  /**
   * Parse AI response for lead detection results
   */
  private parseAILeadResponse(aiResponse: string): LeadDetectionResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        isLead: Boolean(parsed.isLead),
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
        reason: String(parsed.reason || 'No reason provided'),
        suggestedActions: Array.isArray(parsed.suggestedActions) 
          ? parsed.suggestedActions.map(String)
          : [],
        extractedInfo: parsed.extractedInfo || undefined
      };

    } catch (error) {
      logger.warn('Failed to parse AI lead response', {
        error: error instanceof Error ? error.message : String(error),
        response: aiResponse.substring(0, 200)
      });

      // Fallback to keyword-based analysis
      return this.fallbackLeadDetection(aiResponse);
    }
  }

  /**
   * Fallback lead detection using keyword analysis
   */
  private fallbackLeadDetection(content: string): LeadDetectionResult {
    const lowerContent = content.toLowerCase();
    const leadKeywords = [
      'buy', 'sell', 'property', 'house', 'home', 'real estate', 
      'listing', 'investment', 'mortgage', 'loan', 'agent', 
      'broker', 'valuation', 'appraisal', 'market value'
    ];

    const matches = leadKeywords.filter(keyword => lowerContent.includes(keyword));
    const confidence = Math.min(0.8, matches.length * 0.1);

    return {
      isLead: confidence > 0.3,
      confidence,
      reason: matches.length > 0 
        ? `Detected real estate keywords: ${matches.join(', ')}`
        : 'No clear real estate intent detected',
      suggestedActions: matches.length > 0 
        ? ['Follow up within 24 hours', 'Qualify lead requirements', 'Send relevant listings']
        : []
    };
  }

  /**
   * Batch process multiple email threads for lead detection
   */
  async batchProcessEmailThreads(
    orgId: string, 
    threadIds: string[]
  ): Promise<{
    processed: number;
    leadsCreated: number;
    errors: number;
  }> {
    let processed = 0;
    let leadsCreated = 0;
    let errors = 0;

    for (const threadId of threadIds) {
      try {
        const initialLeadCount = await prisma.lead.count({ 
          where: { orgId, sourceThreadId: threadId }
        });

        await this.processEmailThread(orgId, threadId);

        const finalLeadCount = await prisma.lead.count({ 
          where: { orgId, sourceThreadId: threadId }
        });

        if (finalLeadCount > initialLeadCount) {
          leadsCreated++;
        }
        processed++;

      } catch (error) {
        errors++;
        logger.error('Batch processing error', {
          orgId,
          threadId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Batch lead processing completed', {
      orgId,
      totalThreads: threadIds.length,
      processed,
      leadsCreated,
      errors,
      action: 'batch_processing_complete'
    });

    return { processed, leadsCreated, errors };
  }
}

export const leadDetectionService = new LeadDetectionService();