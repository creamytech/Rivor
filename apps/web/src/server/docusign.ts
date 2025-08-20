import { logger } from '@/lib/logger';

export interface DocuSignConfig {
  integrationKey: string;
  userId: string;
  accountId: string;
  privateKey: string;
  basePath: string;
}

export interface SigningRequest {
  documentName: string;
  documentContent: Buffer;
  signers: Array<{
    name: string;
    email: string;
    routingOrder: number;
    tabs?: {
      signHereTabs?: Array<{
        anchorString?: string;
        anchorXOffset?: string;
        anchorYOffset?: string;
        xPosition?: string;
        yPosition?: string;
        documentId?: string;
        pageNumber?: string;
      }>;
      dateSignedTabs?: Array<{
        anchorString?: string;
        anchorXOffset?: string;
        anchorYOffset?: string;
        xPosition?: string;
        yPosition?: string;
        documentId?: string;
        pageNumber?: string;
      }>;
    };
  }>;
  returnUrl?: string;
  emailSubject?: string;
  emailMessage?: string;
}

export interface EnvelopeStatus {
  envelopeId: string;
  status: 'created' | 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
  statusDateTime: string;
  signers: Array<{
    name: string;
    email: string;
    status: 'created' | 'sent' | 'delivered' | 'completed' | 'declined';
    signedDateTime?: string;
  }>;
}

class DocuSignService {
  private config: DocuSignConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    // Initialize config from environment variables
    if (process.env.DOCUSIGN_INTEGRATION_KEY && 
        process.env.DOCUSIGN_USER_ID && 
        process.env.DOCUSIGN_ACCOUNT_ID) {
      this.config = {
        integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
        userId: process.env.DOCUSIGN_USER_ID,
        accountId: process.env.DOCUSIGN_ACCOUNT_ID,
        privateKey: process.env.DOCUSIGN_PRIVATE_KEY || '',
        basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi'
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error('DocuSign not configured. Please set environment variables.');
    }

    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      // For production, implement JWT authentication
      // For now, return a mock token for development
      if (process.env.NODE_ENV === 'development') {
        this.accessToken = 'mock_access_token';
        this.tokenExpiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
        return this.accessToken;
      }

      // JWT authentication would be implemented here
      const jwtToken = await this.generateJWTToken();
      const response = await fetch(`${this.config.basePath}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`DocuSign auth failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get DocuSign access token', { error });
      throw error;
    }
  }

  private async generateJWTToken(): Promise<string> {
    // This would implement JWT token generation using private key
    // For development, return a mock token
    if (process.env.NODE_ENV === 'development') {
      return 'mock_jwt_token';
    }

    // Implementation would use jsonwebtoken library and private key
    throw new Error('JWT token generation not implemented in demo');
  }

  public async createEnvelope(request: SigningRequest): Promise<string> {
    if (!this.config) {
      throw new Error('DocuSign not configured');
    }

    try {
      const accessToken = await this.getAccessToken();

      // For development, return a mock envelope ID
      if (process.env.NODE_ENV === 'development') {
        const mockEnvelopeId = `mock_env_${Date.now()}`;
        logger.info('Created mock DocuSign envelope', { 
          envelopeId: mockEnvelopeId,
          documentName: request.documentName,
          signers: request.signers.map(s => s.email)
        });
        return mockEnvelopeId;
      }

      // Prepare envelope definition
      const envelopeDefinition = {
        emailSubject: request.emailSubject || `Please sign: ${request.documentName}`,
        emailMessage: request.emailMessage || 'Please review and sign this document.',
        status: 'sent',
        documents: [{
          documentId: '1',
          name: request.documentName,
          documentBase64: request.documentContent.toString('base64'),
          fileExtension: 'pdf'
        }],
        recipients: {
          signers: request.signers.map((signer, index) => ({
            email: signer.email,
            name: signer.name,
            recipientId: String(index + 1),
            routingOrder: signer.routingOrder,
            tabs: signer.tabs || {
              signHereTabs: [{
                anchorString: 'Signature:',
                anchorXOffset: '100',
                anchorYOffset: '0',
                documentId: '1'
              }],
              dateSignedTabs: [{
                anchorString: 'Date:',
                anchorXOffset: '100',
                anchorYOffset: '0',
                documentId: '1'
              }]
            }
          }))
        }
      };

      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(envelopeDefinition),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`DocuSign envelope creation failed: ${errorData}`);
      }

      const result = await response.json();
      
      logger.info('DocuSign envelope created successfully', {
        envelopeId: result.envelopeId,
        status: result.status,
        documentName: request.documentName
      });

      return result.envelopeId;

    } catch (error) {
      logger.error('Failed to create DocuSign envelope', { 
        error: error?.message || error,
        documentName: request.documentName 
      });
      throw error;
    }
  }

  public async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus> {
    if (!this.config) {
      throw new Error('DocuSign not configured');
    }

    try {
      const accessToken = await this.getAccessToken();

      // For development, return mock status
      if (process.env.NODE_ENV === 'development' || envelopeId.startsWith('mock_')) {
        return {
          envelopeId,
          status: 'sent',
          statusDateTime: new Date().toISOString(),
          signers: [{
            name: 'Mock Signer',
            email: 'mock@example.com',
            status: 'sent'
          }]
        };
      }

      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get envelope status: ${response.statusText}`);
      }

      const envelope = await response.json();

      // Get recipient status
      const recipientsResponse = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/recipients`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      let signers = [];
      if (recipientsResponse.ok) {
        const recipients = await recipientsResponse.json();
        signers = recipients.signers?.map((signer: any) => ({
          name: signer.name,
          email: signer.email,
          status: signer.status,
          signedDateTime: signer.signedDateTime
        })) || [];
      }

      return {
        envelopeId,
        status: envelope.status,
        statusDateTime: envelope.statusChangedDateTime || envelope.createdDateTime,
        signers
      };

    } catch (error) {
      logger.error('Failed to get DocuSign envelope status', { 
        error: error?.message || error,
        envelopeId 
      });
      throw error;
    }
  }

  public async getSigningUrl(envelopeId: string, signerEmail: string, returnUrl?: string): Promise<string> {
    if (!this.config) {
      throw new Error('DocuSign not configured');
    }

    try {
      const accessToken = await this.getAccessToken();

      // For development, return mock URL
      if (process.env.NODE_ENV === 'development' || envelopeId.startsWith('mock_')) {
        return `https://demo.docusign.net/signing/${envelopeId}?email=${encodeURIComponent(signerEmail)}`;
      }

      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/views/recipient`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authenticationMethod: 'email',
            email: signerEmail,
            returnUrl: returnUrl || `${process.env.NEXTAUTH_URL}/app/documents?signed=${envelopeId}`,
            userName: signerEmail
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get signing URL: ${response.statusText}`);
      }

      const result = await response.json();
      return result.url;

    } catch (error) {
      logger.error('Failed to get DocuSign signing URL', { 
        error: error?.message || error,
        envelopeId,
        signerEmail 
      });
      throw error;
    }
  }

  public isConfigured(): boolean {
    return this.config !== null;
  }
}

// Export singleton instance
export const docuSignService = new DocuSignService();

// Webhook handler for DocuSign events
export async function handleDocuSignWebhook(payload: any) {
  try {
    logger.info('DocuSign webhook received', { 
      event: payload.event,
      envelopeId: payload.data?.envelopeId 
    });

    // Handle different webhook events
    switch (payload.event) {
      case 'envelope-completed':
        await handleEnvelopeCompleted(payload.data);
        break;
      case 'envelope-signed':
        await handleEnvelopeSigned(payload.data);
        break;
      case 'envelope-declined':
        await handleEnvelopeDeclined(payload.data);
        break;
      default:
        logger.info('Unhandled DocuSign webhook event', { event: payload.event });
    }

  } catch (error) {
    logger.error('Failed to handle DocuSign webhook', { error });
    throw error;
  }
}

async function handleEnvelopeCompleted(data: any) {
  // Update document status in database
  logger.info('Envelope completed', { envelopeId: data.envelopeId });
  // TODO: Update document status to 'completed'
}

async function handleEnvelopeSigned(data: any) {
  // Update document status when signed
  logger.info('Envelope signed', { envelopeId: data.envelopeId });
  // TODO: Update document status to 'signed'
}

async function handleEnvelopeDeclined(data: any) {
  // Handle when envelope is declined
  logger.info('Envelope declined', { envelopeId: data.envelopeId });
  // TODO: Update document status to 'declined'
}