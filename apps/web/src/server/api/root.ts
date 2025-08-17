import { router } from "./trpc";
import { z } from "zod";
import { publicProcedure, protectedProcedure } from "./trpc";
import { prisma } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

// Helper to get current user's org
async function getCurrentUserOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orgMembers: {
        include: { org: true }
      }
    }
  });

  if (!user?.orgMembers?.[0]?.org) {
    throw new Error("No organization found");
  }

  return user.orgMembers[0].org;
}

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  echo: publicProcedure.input(z.object({ text: z.string() })).mutation(({ input }) => ({ text: input.text })),

  // Dashboard Data
  dashboard: protectedProcedure.query(async () => {
    const org = await getCurrentUserOrg();
    
    // Get leads data
    const leadsData = await prisma.lead.groupBy({
      by: ['status'],
      where: { orgId: org.id },
      _count: { id: true }
    });

    const totalLeads = leadsData.reduce((sum, group) => sum + group._count.id, 0);
    const newLeads = await prisma.lead.count({
      where: { 
        orgId: org.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    // Get replies due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const repliesDueToday = await prisma.task.count({
      where: {
        orgId: org.id,
        dueAt: { gte: today, lt: tomorrow },
        done: false,
        title: { contains: 'reply', mode: 'insensitive' }
      }
    });

    // Get meetings today
    const meetingsToday = await prisma.calendarEvent.count({
      where: {
        orgId: org.id,
        start: { gte: today, lt: tomorrow }
      }
    });

    // Get token health
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId: org.id },
      select: { status: true, lastSyncedAt: true, errorReason: true }
    });

    const healthyAccounts = emailAccounts.filter(acc => acc.status === 'connected').length;
    const totalAccounts = emailAccounts.length;

    return {
      leadsData: {
        new: newLeads,
        total: totalLeads,
        trend: newLeads > 0 ? 'up' : 'stable'
      },
      repliesData: {
        due: repliesDueToday,
        trend: repliesDueToday > 0 ? 'up' : 'stable'
      },
      meetingsData: {
        today: meetingsToday,
        trend: meetingsToday > 0 ? 'up' : 'stable'
      },
      tokenHealthData: {
        healthy: healthyAccounts,
        total: totalAccounts,
        status: healthyAccounts === totalAccounts ? 'healthy' : 'warning'
      }
    };
  }),

  // Lead Management
  leads: {
    list: protectedProcedure
      .input(z.object({
        stageId: z.string().optional(),
        assignedToId: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.stageId) where.stageId = input.stageId;
        if (input.assignedToId) where.assignedToId = input.assignedToId;
        if (input.status) where.status = input.status;
        if (input.search) {
          where.OR = [
            { title: { contains: input.search, mode: 'insensitive' } },
            { contact: { nameEnc: { not: null } } }
          ];
        }

        const leads = await prisma.lead.findMany({
          where,
          include: {
            contact: true,
            assignedTo: {
              include: { user: true }
            },
            stage: true,
            tasks: {
              where: { done: false },
              orderBy: { dueAt: 'asc' },
              take: 1
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: input.limit,
          skip: input.offset
        });

        const total = await prisma.lead.count({ where });

        return { leads, total };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        contactId: z.string().optional(),
        stageId: z.string().optional(),
        assignedToId: z.string().optional(),
        dealValue: z.number().optional(),
        probabilityPercent: z.number().optional(),
        notes: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        source: z.string().optional(),
        expectedCloseDate: z.date().optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.lead.create({
          data: {
            ...input,
            orgId: org.id
          },
          include: {
            contact: true,
            assignedTo: {
              include: { user: true }
            },
            stage: true
          }
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        stageId: z.string().optional(),
        assignedToId: z.string().optional(),
        dealValue: z.number().optional(),
        probabilityPercent: z.number().optional(),
        notes: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        status: z.string().optional(),
        expectedCloseDate: z.date().optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        const { id, ...data } = input;
        
        return await prisma.lead.update({
          where: { id, orgId: org.id },
          data,
          include: {
            contact: true,
            assignedTo: {
              include: { user: true }
            },
            stage: true
          }
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.lead.delete({
          where: { id: input.id, orgId: org.id }
        });
      }),

    bulkUpdate: protectedProcedure
      .input(z.object({
        ids: z.array(z.string()),
        stageId: z.string().optional(),
        assignedToId: z.string().optional(),
        status: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        const { ids, ...data } = input;
        
        return await prisma.lead.updateMany({
          where: { 
            id: { in: ids },
            orgId: org.id
          },
          data
        });
      })
  },

  // Pipeline Stages
  pipelineStages: {
    list: protectedProcedure.query(async () => {
      const org = await getCurrentUserOrg();
      
      return await prisma.pipelineStage.findMany({
        where: { orgId: org.id },
        include: {
          _count: { leads: true }
        },
        orderBy: { order: 'asc' }
      });
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        color: z.string().optional(),
        order: z.number()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.pipelineStage.create({
          data: {
            ...input,
            orgId: org.id
          }
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        color: z.string().optional(),
        order: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        const { id, ...data } = input;
        
        return await prisma.pipelineStage.update({
          where: { id, orgId: org.id },
          data
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.pipelineStage.delete({
          where: { id: input.id, orgId: org.id }
        });
      })
  },

  // Contacts
  contacts: {
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.search) {
          where.OR = [
            { nameEnc: { not: null } },
            { emailEnc: { not: null } },
            { companyEnc: { not: null } }
          ];
        }
        if (input.tags && input.tags.length > 0) {
          where.tags = { hasSome: input.tags };
        }

        const contacts = await prisma.contact.findMany({
          where,
          include: {
            leads: {
              include: { stage: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: input.limit,
          skip: input.offset
        });

        const total = await prisma.contact.count({ where });

        return { contacts, total };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
        tags: z.array(z.string()).default([])
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.contact.create({
          data: {
            ...input,
            orgId: org.id
          }
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        const { id, ...data } = input;
        
        return await prisma.contact.update({
          where: { id, orgId: org.id },
          data
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.contact.delete({
          where: { id: input.id, orgId: org.id }
        });
      })
  },

  // Tasks
  tasks: {
    list: protectedProcedure
      .input(z.object({
        done: z.boolean().optional(),
        assignedToId: z.string().optional(),
        dueDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.done !== undefined) where.done = input.done;
        if (input.assignedToId) where.assignedToId = input.assignedToId;
        if (input.dueDate) {
          const startOfDay = new Date(input.dueDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(startOfDay);
          endOfDay.setDate(endOfDay.getDate() + 1);
          where.dueAt = { gte: startOfDay, lt: endOfDay };
        }

        const tasks = await prisma.task.findMany({
          where,
          include: {
            assignedTo: {
              include: { user: true }
            },
            lead: {
              include: { contact: true }
            }
          },
          orderBy: [
            { done: 'asc' },
            { dueAt: 'asc' },
            { createdAt: 'desc' }
          ],
          take: input.limit,
          skip: input.offset
        });

        const total = await prisma.task.count({ where });

        return { tasks, total };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        dueAt: z.date().optional(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        assignedToId: z.string().optional(),
        linkLeadId: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.task.create({
          data: {
            ...input,
            orgId: org.id
          },
          include: {
            assignedTo: {
              include: { user: true }
            },
            lead: {
              include: { contact: true }
            }
          }
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueAt: z.date().optional(),
        done: z.boolean().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        assignedToId: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        const { id, ...data } = input;
        
        return await prisma.task.update({
          where: { id, orgId: org.id },
          data,
          include: {
            assignedTo: {
              include: { user: true }
            },
            lead: {
              include: { contact: true }
            }
          }
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.task.delete({
          where: { id: input.id, orgId: org.id }
        });
      })
  },

  // Email Threads
  emailThreads: {
    list: protectedProcedure
      .input(z.object({
        unread: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.unread !== undefined) where.unread = input.unread;
        if (input.search) {
          where.OR = [
            { subjectEnc: { not: null } },
            { participantsEnc: { not: null } }
          ];
        }

        const threads = await prisma.emailThread.findMany({
          where,
          include: {
            account: true,
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1
            },
            _count: { messages: true }
          },
          orderBy: { updatedAt: 'desc' },
          take: input.limit,
          skip: input.offset
        });

        const total = await prisma.emailThread.count({ where });

        return { threads, total };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.emailThread.findUnique({
          where: { id: input.id, orgId: org.id },
          include: {
            account: true,
            messages: {
              orderBy: { sentAt: 'asc' }
            }
          }
        });
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.emailThread.update({
          where: { id: input.id, orgId: org.id },
          data: { unread: false }
        });
      })
  },

  // Calendar Events
  calendarEvents: {
    list: protectedProcedure
      .input(z.object({
        start: z.date(),
        end: z.date()
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.calendarEvent.findMany({
          where: {
            orgId: org.id,
            start: { gte: input.start },
            end: { lte: input.end }
          },
          include: {
            account: true
          },
          orderBy: { start: 'asc' }
        });
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        start: z.date(),
        end: z.date(),
        location: z.string().optional(),
        notes: z.string().optional(),
        attendees: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        // Get the first calendar account for the org
        const calendarAccount = await prisma.calendarAccount.findFirst({
          where: { orgId: org.id }
        });

        if (!calendarAccount) {
          throw new Error("No calendar account configured");
        }

        return await prisma.calendarEvent.create({
          data: {
            ...input,
            orgId: org.id,
            accountId: calendarAccount.id
          }
        });
      })
  },

  // Integration Health
  integrations: {
    health: protectedProcedure.query(async () => {
      const org = await getCurrentUserOrg();
      
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId: org.id },
        select: {
          id: true,
          provider: true,
          status: true,
          lastSyncedAt: true,
          errorReason: true
        }
      });

      const calendarAccounts = await prisma.calendarAccount.findMany({
        where: { orgId: org.id },
        select: {
          id: true,
          provider: true,
          status: true
        }
      });

      return {
        emailAccounts,
        calendarAccounts
      };
    })
  },

  // Search
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      type: z.enum(['all', 'leads', 'contacts', 'threads']).default('all'),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const org = await getCurrentUserOrg();
      const results: any[] = [];

      if (input.type === 'all' || input.type === 'leads') {
        const leads = await prisma.lead.findMany({
          where: {
            orgId: org.id,
            title: { contains: input.query, mode: 'insensitive' }
          },
          include: {
            contact: true,
            stage: true
          },
          take: input.limit
        });
        results.push(...leads.map(lead => ({ ...lead, type: 'lead' })));
      }

      if (input.type === 'all' || input.type === 'contacts') {
        const contacts = await prisma.contact.findMany({
          where: {
            orgId: org.id,
            OR: [
              { nameEnc: { not: null } },
              { emailEnc: { not: null } },
              { companyEnc: { not: null } }
            ]
          },
          take: input.limit
        });
        results.push(...contacts.map(contact => ({ ...contact, type: 'contact' })));
      }

      if (input.type === 'all' || input.type === 'threads') {
        const threads = await prisma.emailThread.findMany({
          where: {
            orgId: org.id,
            subjectEnc: { not: null }
          },
          include: {
            account: true
          },
          take: input.limit
        });
        results.push(...threads.map(thread => ({ ...thread, type: 'thread' })));
      }

      return results.slice(0, input.limit);
    })
});

export type AppRouter = typeof appRouter;
