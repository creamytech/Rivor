import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";
import { decryptForOrg } from "@/server/crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const format = searchParams.get('format') || 'csv';

    // Calculate date range based on timeframe
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'ytd':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Fetch comprehensive data for export
    const [deals, contacts, emails, tasks] = await Promise.all([
      prisma.lead.findMany({
        where: {
          orgId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          contact: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contact.findMany({
        where: {
          orgId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailThread.findMany({
        where: {
          orgId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.task.findMany({
        where: {
          orgId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (format === 'csv') {
      // Generate CSV content
      const csvContent = await generateCSVReport({
        deals,
        contacts,
        emails,
        tasks,
        orgId,
        timeframe
      });

      const filename = `rivor-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;

      logger.info('Report exported', {
        userId: session.user?.email,
        orgId,
        timeframe,
        format,
        dealsCount: deals.length,
        contactsCount: contacts.length
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    }

    // For other formats, return JSON
    const reportData = {
      timeframe,
      exportDate: new Date().toISOString(),
      summary: {
        totalDeals: deals.length,
        totalContacts: contacts.length,
        totalEmails: emails.length,
        totalTasks: tasks.length
      },
      deals: await Promise.all(deals.map(async (deal) => ({
        id: deal.id,
        title: deal.title,
        status: deal.status,
        stage: deal.stage,
        propertyValue: deal.propertyValue,
        propertyAddress: deal.propertyAddress ? await decryptForOrg(deal.propertyAddress, orgId) : '',
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate,
        createdAt: deal.createdAt,
        contactName: deal.contact ? await decryptForOrg(deal.contact.name, orgId) : ''
      }))),
      contacts: await Promise.all(contacts.map(async (contact) => ({
        id: contact.id,
        name: await decryptForOrg(contact.name, orgId),
        email: await decryptForOrg(contact.email, orgId),
        phone: contact.phone ? await decryptForOrg(contact.phone, orgId) : '',
        company: contact.company ? await decryptForOrg(contact.company, orgId) : '',
        source: contact.source,
        leadScore: contact.leadScore,
        lastActivity: contact.lastActivity,
        createdAt: contact.createdAt
      }))),
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
        completedAt: task.completedAt,
        createdAt: task.createdAt
      }))
    };

    return NextResponse.json(reportData);

  } catch (error) {
    logger.error('Failed to export report', { error });
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

async function generateCSVReport(data: {
  deals: any[];
  contacts: any[];
  emails: any[];
  tasks: any[];
  orgId: string;
  timeframe: string;
}): Promise<string> {
  const { deals, contacts, emails, tasks, orgId } = data;
  
  let csv = '';
  
  // Header
  csv += `Rivor CRM Report\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n`;
  csv += `Timeframe: ${data.timeframe}\n\n`;
  
  // Deals section
  csv += `DEALS SUMMARY\n`;
  csv += `ID,Title,Status,Stage,Property Value,Property Address,Probability,Expected Close,Created Date,Contact\n`;
  
  for (const deal of deals) {
    const propertyAddress = deal.propertyAddress ? await decryptForOrg(deal.propertyAddress, orgId) : '';
    const contactName = deal.contact ? await decryptForOrg(deal.contact.name, orgId) : '';
    
    csv += `"${deal.id}","${deal.title}","${deal.status}","${deal.stage}",`;
    csv += `"${deal.propertyValue || 0}","${propertyAddress}","${deal.probability || 0}%",`;
    csv += `"${deal.expectedCloseDate || ''}","${deal.createdAt.toLocaleDateString()}","${contactName}"\n`;
  }
  
  csv += `\n`;
  
  // Contacts section
  csv += `CONTACTS SUMMARY\n`;
  csv += `ID,Name,Email,Phone,Company,Source,Lead Score,Last Activity,Created Date\n`;
  
  for (const contact of contacts) {
    const name = await decryptForOrg(contact.name, orgId);
    const email = await decryptForOrg(contact.email, orgId);
    const phone = contact.phone ? await decryptForOrg(contact.phone, orgId) : '';
    const company = contact.company ? await decryptForOrg(contact.company, orgId) : '';
    
    csv += `"${contact.id}","${name}","${email}","${phone}","${company}",`;
    csv += `"${contact.source || ''}","${contact.leadScore || 0}","${contact.lastActivity || ''}","${contact.createdAt.toLocaleDateString()}"\n`;
  }
  
  csv += `\n`;
  
  // Tasks section
  csv += `TASKS SUMMARY\n`;
  csv += `ID,Title,Status,Priority,Due Date,Completed Date,Created Date\n`;
  
  for (const task of tasks) {
    csv += `"${task.id}","${task.title}","${task.status}","${task.priority}",`;
    csv += `"${task.dueAt ? task.dueAt.toLocaleDateString() : ''}","${task.completedAt ? task.completedAt.toLocaleDateString() : ''}","${task.createdAt.toLocaleDateString()}"\n`;
  }
  
  csv += `\n`;
  
  // Summary statistics
  csv += `SUMMARY STATISTICS\n`;
  csv += `Total Deals,${deals.length}\n`;
  csv += `Total Contacts,${contacts.length}\n`;
  csv += `Total Email Threads,${emails.length}\n`;
  csv += `Total Tasks,${tasks.length}\n`;
  csv += `Closed Deals,${deals.filter(d => d.status === 'closed').length}\n`;
  csv += `Active Deals,${deals.filter(d => d.status === 'active').length}\n`;
  csv += `Completed Tasks,${tasks.filter(t => t.status === 'completed').length}\n`;
  csv += `Pending Tasks,${tasks.filter(t => t.status === 'pending').length}\n`;
  
  const totalValue = deals.reduce((sum, deal) => sum + (deal.propertyValue || 0), 0);
  csv += `Total Pipeline Value,"$${totalValue.toLocaleString()}"\n`;
  
  return csv;
}