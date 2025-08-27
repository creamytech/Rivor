import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { getThreadWithMessages } from '@/server/email';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 AI Debug Test started');
    
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const test = url.searchParams.get('test') || 'config';
    
    const results: any = {
      test: test,
      timestamp: new Date().toISOString(),
      user: session.user.email
    };

    // Test 1: Check configuration
    if (test === 'config' || test === 'all') {
      results.config = {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openaiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'Not set',
        hasSession: !!session,
        hasUser: !!session?.user,
        hasEmail: !!session?.user?.email,
        sessionOrgId: (session as any)?.orgId
      };
    }

    // Test 2: Check database access and user org
    if (test === 'database' || test === 'all') {
      try {
        const userWithOrg = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            orgMembers: {
              include: { org: true }
            }
          }
        });
        
        results.database = {
          userFound: !!userWithOrg,
          hasOrgMembers: !!userWithOrg?.orgMembers?.length,
          orgId: userWithOrg?.orgMembers?.[0]?.orgId,
          orgName: userWithOrg?.orgMembers?.[0]?.org?.name
        };
      } catch (error) {
        results.database = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 3: Check email threads and messages
    if (test === 'emails' || test === 'all') {
      try {
        const orgId = (session as any)?.orgId || 
          (await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { orgMembers: true }
          }))?.orgMembers?.[0]?.orgId;

        if (orgId) {
          // Get recent threads
          const threads = await prisma.emailThread.findMany({
            where: { orgId },
            include: {
              messages: {
                take: 1,
                orderBy: { sentAt: 'desc' }
              }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5
          });

          results.emails = {
            orgId,
            threadCount: threads.length,
            threads: threads.map(t => ({
              id: t.id,
              messageCount: t.messages.length,
              hasMessages: t.messages.length > 0,
              latestMessageId: t.messages[0]?.id
            }))
          };

          // Test decryption on first thread with messages
          const threadWithMessages = threads.find(t => t.messages.length > 0);
          if (threadWithMessages) {
            try {
              const threadData = await getThreadWithMessages(orgId, threadWithMessages.id);
              results.emails.decryptionTest = {
                threadId: threadWithMessages.id,
                success: !!threadData.thread,
                messageCount: threadData.messages.length,
                hasSubject: threadData.messages.length > 0 && !!threadData.messages[0].subject,
                hasBody: threadData.messages.length > 0 && !!threadData.messages[0].body,
                hasFrom: threadData.messages.length > 0 && !!threadData.messages[0].from
              };
            } catch (decryptError) {
              results.emails.decryptionTest = {
                error: decryptError instanceof Error ? decryptError.message : 'Unknown error'
              };
            }
          }
        } else {
          results.emails = { error: 'No orgId found' };
        }
      } catch (error) {
        results.emails = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 4: OpenAI API test
    if (test === 'openai' || test === 'all') {
      try {
        if (!process.env.OPENAI_API_KEY) {
          results.openai = { error: 'OpenAI API key not configured' };
        } else {
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: "You are a test assistant. Respond with exactly this JSON: {\"test\": \"success\", \"message\": \"OpenAI API is working\"}"
              },
              {
                role: "user",
                content: "Test the API"
              }
            ],
            max_tokens: 100,
            temperature: 0.1,
          });

          results.openai = {
            success: true,
            response: completion.choices[0]?.message?.content || 'No response',
            model: completion.model,
            usage: completion.usage
          };
        }
      } catch (error) {
        results.openai = {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack'
        };
      }
    }

    // Test 5: Full AI analysis test
    if (test === 'analysis') {
      const emailId = url.searchParams.get('emailId');
      if (!emailId) {
        results.analysis = { error: 'No emailId provided' };
      } else {
        try {
          // Call our own AI analysis endpoint internally
          const analysisResponse = await fetch(`${url.origin}/api/inbox/ai-analysis`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('Cookie') || ''
            },
            body: JSON.stringify({ emailId })
          });
          
          const analysisResult = await analysisResponse.json();
          results.analysis = {
            status: analysisResponse.status,
            success: analysisResponse.ok,
            result: analysisResult
          };
        } catch (error) {
          results.analysis = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    return NextResponse.json(results, { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('AI Debug test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  }
}