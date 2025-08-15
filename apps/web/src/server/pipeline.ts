import { prisma } from './db';
import { decryptForOrg } from './crypto';

export type UiLead = {
  id: string;
  title: string;
  dealValue?: number;
  stage?: string;
  status: string;
  priority: string;
  expectedCloseDate?: Date;
  contactName?: string;
  createdAt: Date;
};

export type PipelineStats = {
  totalValue: number;
  count: number;
  stageName: string;
  stageId: string;
};

/**
 * Get pipeline statistics by stage
 */
export async function getPipelineStats(orgId: string): Promise<PipelineStats[]> {
  const stages = await prisma.pipelineStage.findMany({
    where: { orgId },
    orderBy: { order: 'asc' },
    include: {
      leads: {
        where: { status: 'active' },
        select: { 
          dealValueEnc: true,
          id: true
        }
      }
    }
  });

  const stats: PipelineStats[] = [];
  
  for (const stage of stages) {
    let totalValue = 0;
    let count = 0;
    
    for (const lead of stage.leads) {
      count++;
      if (lead.dealValueEnc) {
        try {
          const dec = await decryptForOrg(orgId, lead.dealValueEnc, 'lead:dealValue');
          const valueStr = new TextDecoder().decode(dec);
          const value = parseFloat(valueStr) || 0;
          totalValue += value;
        } catch {
          // Skip if can't decrypt
        }
      }
    }

    stats.push({
      stageId: stage.id,
      stageName: stage.name,
      count,
      totalValue
    });
  }

  return stats;
}

/**
 * Get recent leads for an organization
 */
export async function getRecentLeads(orgId: string, limit = 10): Promise<UiLead[]> {
  const raws = await prisma.lead.findMany({
    where: { 
      orgId,
      status: 'active'
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { 
      id: true,
      title: true,
      dealValueEnc: true,
      status: true,
      priority: true,
      expectedCloseDate: true,
      createdAt: true,
      stage: {
        select: { name: true }
      },
      contact: {
        select: { nameEnc: true }
      }
    },
  });

  const leads: UiLead[] = [];
  for (const lead of raws) {
    let dealValue: number | undefined;
    let contactName: string | undefined;

    if (lead.dealValueEnc) {
      try {
        const dec = await decryptForOrg(orgId, lead.dealValueEnc, 'lead:dealValue');
        const valueStr = new TextDecoder().decode(dec);
        dealValue = parseFloat(valueStr) || undefined;
      } catch {
        // Skip if can't decrypt
      }
    }

    if (lead.contact?.nameEnc) {
      try {
        const dec = await decryptForOrg(orgId, lead.contact.nameEnc, 'contact:name');
        contactName = new TextDecoder().decode(dec);
      } catch {
        contactName = '(encrypted)';
      }
    }

    leads.push({
      id: lead.id,
      title: lead.title || 'Untitled Lead',
      dealValue,
      stage: lead.stage?.name,
      status: lead.status,
      priority: lead.priority,
      expectedCloseDate: lead.expectedCloseDate,
      contactName,
      createdAt: lead.createdAt
    });
  }

  return leads;
}

/**
 * Get overall pipeline statistics
 */
export async function getOverallPipelineStats(orgId: string) {
  const [activeLeads, wonLeads, lostLeads] = await Promise.all([
    prisma.lead.count({
      where: { orgId, status: 'active' }
    }),
    prisma.lead.count({
      where: { orgId, status: 'won' }
    }),
    prisma.lead.count({
      where: { orgId, status: 'lost' }
    })
  ]);

  return {
    activeLeads,
    wonLeads,
    lostLeads,
    totalLeads: activeLeads + wonLeads + lostLeads
  };
}
