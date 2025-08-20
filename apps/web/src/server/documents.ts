import { prisma } from "./db";
import { logger } from "@/lib/logger";
import { encryptForOrg, decryptForOrg } from "./crypto";
import { auth } from "./auth";

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'listing' | 'purchase' | 'disclosure' | 'agreement' | 'marketing' | 'legal' | 'other';
  content: string;
  mergeFields: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  templateId?: string;
  content: string;
  status: 'draft' | 'generated' | 'sent' | 'signed' | 'completed';
  linkedDealId?: string;
  linkedContactId?: string;
  folderId?: string;
  generatedPdfUrl?: string;
  docusignEnvelopeId?: string;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  linkedDealId?: string;
  linkedContactId?: string;
  color?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Merge field processor
export function processMergeFields(content: string, data: Record<string, any>): string {
  let processedContent = content;
  
  // Replace merge fields like {{contact.name}}, {{deal.propertyAddress}}, etc.
  const mergeFieldRegex = /\{\{([^}]+)\}\}/g;
  
  processedContent = processedContent.replace(mergeFieldRegex, (match, fieldPath) => {
    const keys = fieldPath.split('.');
    let value = data;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) {
        return `[${fieldPath}]`; // Show placeholder if data missing
      }
    }
    
    // Format common field types
    if (fieldPath.includes('date') && value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (fieldPath.includes('price') || fieldPath.includes('amount')) {
      return typeof value === 'number' ? 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : 
        value;
    }
    
    return String(value);
  });
  
  return processedContent;
}

// Get merge data for a document
export async function getMergeData(dealId?: string, contactId?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  
  const mergeData: Record<string, any> = {
    date: new Date(),
    agent: {
      name: session.user?.name || '',
      email: session.user?.email || '',
    }
  };
  
  if (dealId) {
    const deal = await prisma.lead.findFirst({
      where: { id: dealId },
      include: {
        contact: true,
      }
    });
    
    if (deal) {
      const decryptedDeal = {
        ...deal,
        description: deal.description ? await decryptForOrg(deal.description, deal.orgId) : '',
        propertyAddress: deal.propertyAddress ? await decryptForOrg(deal.propertyAddress, deal.orgId) : '',
        notes: deal.notes ? await decryptForOrg(deal.notes, deal.orgId) : '',
      };
      
      mergeData.deal = {
        id: deal.id,
        title: deal.title,
        description: decryptedDeal.description,
        propertyAddress: decryptedDeal.propertyAddress,
        propertyValue: deal.propertyValue,
        listingId: deal.listingId,
        status: deal.status,
        stage: deal.stage,
        probability: deal.probability,
        notes: decryptedDeal.notes,
        createdAt: deal.createdAt,
        expectedCloseDate: deal.expectedCloseDate,
      };
      
      if (deal.contact) {
        const decryptedContact = {
          ...deal.contact,
          name: await decryptForOrg(deal.contact.name, deal.contact.orgId),
          email: await decryptForOrg(deal.contact.email, deal.contact.orgId),
          phone: deal.contact.phone ? await decryptForOrg(deal.contact.phone, deal.contact.orgId) : '',
          company: deal.contact.company ? await decryptForOrg(deal.contact.company, deal.contact.orgId) : '',
          title: deal.contact.title ? await decryptForOrg(deal.contact.title, deal.contact.orgId) : '',
          notes: deal.contact.notes ? await decryptForOrg(deal.contact.notes, deal.contact.orgId) : '',
        };
        
        mergeData.contact = decryptedContact;
      }
    }
  }
  
  if (contactId && !mergeData.contact) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId }
    });
    
    if (contact) {
      const decryptedContact = {
        ...contact,
        name: await decryptForOrg(contact.name, contact.orgId),
        email: await decryptForOrg(contact.email, contact.orgId),
        phone: contact.phone ? await decryptForOrg(contact.phone, contact.orgId) : '',
        company: contact.company ? await decryptForOrg(contact.company, contact.orgId) : '',
        title: contact.title ? await decryptForOrg(contact.title, contact.orgId) : '',
        notes: contact.notes ? await decryptForOrg(contact.notes, contact.orgId) : '',
      };
      
      mergeData.contact = decryptedContact;
    }
  }
  
  return mergeData;
}

// Default document templates
export const defaultTemplates: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "Listing Agreement",
    description: "Exclusive listing agreement for sellers",
    category: 'listing',
    content: `EXCLUSIVE LISTING AGREEMENT

Property Address: {{deal.propertyAddress}}
List Price: {{deal.propertyValue}}
MLS#: {{deal.listingId}}

Seller: {{contact.name}}
Email: {{contact.email}}
Phone: {{contact.phone}}

Listing Agent: {{agent.name}}
Date: {{date}}

This agreement grants exclusive rights to list and market the above property.

Terms:
- Listing period: 6 months from {{date}}
- Commission: 6% of sale price
- Marketing plan included
- Professional photography included

Seller Signature: ___________________________ Date: ___________

Agent Signature: ___________________________ Date: ___________`,
    mergeFields: ['deal.propertyAddress', 'deal.propertyValue', 'deal.listingId', 'contact.name', 'contact.email', 'contact.phone', 'agent.name', 'date'],
    isActive: true
  },
  {
    name: "Purchase Agreement",
    description: "Standard purchase agreement for buyers",
    category: 'purchase',
    content: `PURCHASE AGREEMENT

Property Address: {{deal.propertyAddress}}
Purchase Price: {{deal.propertyValue}}
MLS#: {{deal.listingId}}

Buyer: {{contact.name}}
Email: {{contact.email}}
Phone: {{contact.phone}}

Buyer's Agent: {{agent.name}}
Date: {{date}}

TERMS AND CONDITIONS:
1. Purchase Price: {{deal.propertyValue}}
2. Earnest Money: $5,000
3. Financing Contingency: 30 days
4. Inspection Contingency: 10 days
5. Closing Date: To be determined

This offer is contingent upon:
- Satisfactory home inspection
- Loan approval
- Clear title

Buyer Signature: ___________________________ Date: ___________

Agent Signature: ___________________________ Date: ___________`,
    mergeFields: ['deal.propertyAddress', 'deal.propertyValue', 'deal.listingId', 'contact.name', 'contact.email', 'contact.phone', 'agent.name', 'date'],
    isActive: true
  },
  {
    name: "Property Disclosure",
    description: "Required property disclosure statement",
    category: 'disclosure',
    content: `PROPERTY DISCLOSURE STATEMENT

Property Address: {{deal.propertyAddress}}
Date: {{date}}

Seller: {{contact.name}}

The seller hereby discloses the following information about the property:

STRUCTURAL:
☐ No known issues
☐ Foundation issues
☐ Roof issues
☐ Other: ________________

SYSTEMS:
☐ Electrical system in good condition
☐ Plumbing system in good condition
☐ HVAC system in good condition
☐ Issues noted: ________________

ENVIRONMENTAL:
☐ No known environmental hazards
☐ Lead paint disclosure required
☐ Asbestos present
☐ Other: ________________

This disclosure is made to the best of the seller's knowledge.

Seller Signature: ___________________________ Date: ___________

Buyer Acknowledgment: ___________________________ Date: ___________`,
    mergeFields: ['deal.propertyAddress', 'contact.name', 'date'],
    isActive: true
  },
  {
    name: "Market Analysis Report",
    description: "Comparative market analysis for clients",
    category: 'marketing',
    content: `COMPARATIVE MARKET ANALYSIS

Prepared for: {{contact.name}}
Property: {{deal.propertyAddress}}
Date: {{date}}
Prepared by: {{agent.name}}

PROPERTY DETAILS:
Address: {{deal.propertyAddress}}
Listed Price: {{deal.propertyValue}}
MLS#: {{deal.listingId}}

MARKET OVERVIEW:
This analysis provides an estimate of market value based on recent comparable sales in the area.

COMPARABLE SALES:
(To be filled with specific comparables)

MARKET TRENDS:
- Average days on market: 45 days
- Price per square foot: $XXX
- Market appreciation: X% annually

RECOMMENDATION:
Based on current market conditions, the recommended listing price range is:
Low: {{deal.propertyValue}} * 0.95
High: {{deal.propertyValue}} * 1.05

Prepared by: {{agent.name}}
Contact: {{agent.email}}`,
    mergeFields: ['contact.name', 'deal.propertyAddress', 'deal.propertyValue', 'deal.listingId', 'agent.name', 'agent.email', 'date'],
    isActive: true
  },
  {
    name: "Buyer Consultation Agreement",
    description: "Agreement for buyer representation",
    category: 'agreement',
    content: `BUYER CONSULTATION AGREEMENT

Buyer: {{contact.name}}
Email: {{contact.email}}
Phone: {{contact.phone}}

Buyer's Agent: {{agent.name}}
Date: {{date}}

BUYER REPRESENTATION AGREEMENT

This agreement establishes an exclusive relationship between the buyer and agent for the purchase of real estate.

BUYER CRITERIA:
- Price Range: Up to {{deal.propertyValue}}
- Preferred Areas: {{deal.propertyAddress}}
- Property Type: Single Family, Condo, Townhome
- Timeline: 90 days

AGENT SERVICES:
- Property search and showing coordination
- Market analysis and pricing guidance
- Negotiation assistance
- Transaction coordination
- Due diligence support

COMPENSATION:
Agent compensation will be paid by the seller or listing agent at closing.

TERMS:
This agreement is effective for 90 days from {{date}}.

Buyer Signature: ___________________________ Date: ___________

Agent Signature: ___________________________ Date: ___________`,
    mergeFields: ['contact.name', 'contact.email', 'contact.phone', 'agent.name', 'deal.propertyValue', 'deal.propertyAddress', 'date'],
    isActive: true
  }
];

export async function createDefaultTemplates(orgId: string) {
  try {
    for (const template of defaultTemplates) {
      await prisma.documentTemplate.create({
        data: {
          ...template,
          orgId,
          content: await encryptForOrg(template.content, orgId),
          mergeFields: JSON.stringify(template.mergeFields),
        }
      });
    }
    
    logger.info('Created default document templates', { orgId });
  } catch (error) {
    logger.error('Failed to create default templates', { orgId, error });
    throw error;
  }
}