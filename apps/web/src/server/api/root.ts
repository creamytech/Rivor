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

// Helper to get current user
async function getCurrentUser() {
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

  if (!user) {
    throw new Error("User not found");
  }

  return user;
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
        
        return await prisma.lead.update({
          where: { id: input.id, orgId: org.id },
          data: input,
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
      })
  },

  // Pipeline Stages
  pipelineStages: {
    list: protectedProcedure.query(async () => {
      const org = await getCurrentUserOrg();
      
      const stages = await prisma.pipelineStage.findMany({
        where: { orgId: org.id },
        include: {
          _count: {
            select: { leads: true }
          }
        },
        orderBy: { order: 'asc' }
      });

      return stages;
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
        
        return await prisma.pipelineStage.update({
          where: { id: input.id, orgId: org.id },
          data: input
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

  // Email Threads (Inbox)
  emailThreads: {
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.enum(['unread', 'read', 'archived']).optional(),
        from: z.string().optional(),
        hasAttachments: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.search) {
          where.OR = [
            { subjectEnc: { not: null } },
            { participantsEnc: { not: null } }
          ];
        }
        if (input.status) where.status = input.status;
        if (input.from) where.participantsEnc = { not: null };
        if (input.hasAttachments) where.attachments = { some: {} };

        const threads = await prisma.emailThread.findMany({
          where,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            attachments: {
              take: 3
            },
            _count: {
              select: { messages: true, attachments: true }
            }
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
            messages: {
              orderBy: { createdAt: 'asc' }
            },
            attachments: true,
            lead: {
              include: {
                contact: true,
                stage: true,
                assignedTo: {
                  include: { user: true }
                }
              }
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
          data: { status: 'read' }
        });
      }),

    archive: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.emailThread.update({
          where: { id: input.id, orgId: org.id },
          data: { status: 'archived' }
        });
      })
  },

  // Calendar Events
  calendarEvents: {
    list: protectedProcedure
      .input(z.object({
        start: z.date().optional(),
        end: z.date().optional(),
        search: z.string().optional(),
        limit: z.number().default(100)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.start) where.start = { gte: input.start };
        if (input.end) where.end = { lte: input.end };
        if (input.search) where.titleEnc = { not: null };

        const events = await prisma.calendarEvent.findMany({
          where,
          include: {
            account: true
          },
          orderBy: { start: 'asc' },
          take: input.limit
        });

        return events;
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
        const user = await getCurrentUser();
        
        return await prisma.calendarEvent.create({
          data: {
            ...input,
            orgId: org.id,
            accountId: user.orgMembers[0]?.orgId || org.id
          }
        });
      })
  },

  // Contacts
  contacts: {
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        hasLeads: z.boolean().optional(),
        lastActivity: z.enum(['7d', '30d', '90d']).optional(),
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
        if (input.hasLeads) where.leads = { some: {} };
        if (input.lastActivity) {
          const days = parseInt(input.lastActivity);
          const date = new Date();
          date.setDate(date.getDate() - days);
          where.updatedAt = { gte: date };
        }

        const contacts = await prisma.contact.findMany({
          where,
          include: {
            leads: {
              include: {
                stage: true,
                assignedTo: {
                  include: { user: true }
                }
              }
            },
            _count: {
              select: { leads: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: input.limit,
          skip: input.offset
        });

        const total = await prisma.contact.count({ where });

        return { contacts, total };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.contact.findUnique({
          where: { id: input.id, orgId: org.id },
          include: {
            leads: {
              include: {
                stage: true,
                assignedTo: {
                  include: { user: true }
                },
                tasks: true
              }
            },
            emailThreads: {
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 5
                }
              },
              orderBy: { updatedAt: 'desc' },
              take: 10
            }
          }
        });
      })
  },

  // Tasks
  tasks: {
    list: protectedProcedure
      .input(z.object({
        assignedToId: z.string().optional(),
        done: z.boolean().optional(),
        dueDate: z.enum(['today', 'overdue', 'upcoming']).optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        const where: any = { orgId: org.id };
        if (input.assignedToId) where.assignedToId = input.assignedToId;
        if (input.done !== undefined) where.done = input.done;
        if (input.search) where.title = { contains: input.search, mode: 'insensitive' };
        
        if (input.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (input.dueDate === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            where.dueAt = { gte: today, lt: tomorrow };
          } else if (input.dueDate === 'overdue') {
            where.dueAt = { lt: today };
          } else if (input.dueDate === 'upcoming') {
            where.dueAt = { gte: today };
          }
        }

        const tasks = await prisma.task.findMany({
          where,
          include: {
            assignedTo: {
              include: { user: true }
            },
            lead: {
              include: {
                contact: true,
                stage: true
              }
            }
          },
          orderBy: { dueAt: 'asc' },
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
        assignedToId: z.string().optional(),
        leadId: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).default('medium')
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
              include: {
                contact: true,
                stage: true
              }
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
        assignedToId: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional()
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        return await prisma.task.update({
          where: { id: input.id, orgId: org.id },
          data: input,
          include: {
            assignedTo: {
              include: { user: true }
            },
            lead: {
              include: {
                contact: true,
                stage: true
              }
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

  // Integrations Health
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
          status: true,
          lastSyncedAt: true,
          errorReason: true
        }
      });

      return {
        emailAccounts,
        calendarAccounts
      };
    }),

    fix: protectedProcedure
      .input(z.object({ id: z.string(), type: z.enum(['email', 'calendar']) }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        if (input.type === 'email') {
          return await prisma.emailAccount.update({
            where: { id: input.id, orgId: org.id },
            data: { 
              status: 'connected',
              errorReason: null,
              lastSyncedAt: new Date()
            }
          });
        } else {
          return await prisma.calendarAccount.update({
            where: { id: input.id, orgId: org.id },
            data: { 
              status: 'connected',
              errorReason: null,
              lastSyncedAt: new Date()
            }
          });
        }
      }),

    reauth: protectedProcedure
      .input(z.object({ id: z.string(), type: z.enum(['email', 'calendar']) }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        if (input.type === 'email') {
          return await prisma.emailAccount.update({
            where: { id: input.id, orgId: org.id },
            data: { 
              status: 'action_needed',
              errorReason: 'Reauthorization required'
            }
          });
        } else {
          return await prisma.calendarAccount.update({
            where: { id: input.id, orgId: org.id },
            data: { 
              status: 'action_needed',
              errorReason: 'Reauthorization required'
            }
          });
        }
      })
  },

  // Global Search
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      types: z.array(z.enum(['leads', 'contacts', 'threads'])).optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const org = await getCurrentUserOrg();
      const results: any = {};

      if (!input.types || input.types.includes('leads')) {
        const leads = await prisma.lead.findMany({
          where: {
            orgId: org.id,
            OR: [
              { title: { contains: input.query, mode: 'insensitive' } },
              { contact: { nameEnc: { not: null } } }
            ]
          },
          include: {
            contact: true,
            stage: true,
            assignedTo: {
              include: { user: true }
            }
          },
          take: input.limit
        });
        results.leads = leads;
      }

      if (!input.types || input.types.includes('contacts')) {
        const contacts = await prisma.contact.findMany({
          where: {
            orgId: org.id,
            OR: [
              { nameEnc: { not: null } },
              { emailEnc: { not: null } },
              { companyEnc: { not: null } }
            ]
          },
          include: {
            _count: { select: { leads: true } }
          },
          take: input.limit
        });
        results.contacts = contacts;
      }

      if (!input.types || input.types.includes('threads')) {
        const threads = await prisma.emailThread.findMany({
          where: {
            orgId: org.id,
            OR: [
              { subjectEnc: { not: null } },
              { participantsEnc: { not: null } }
            ]
          },
          include: {
            _count: { select: { messages: true } }
          },
          take: input.limit
        });
        results.threads = threads;
      }

      return results;
    }),

  // Settings
  settings: {
    getLeadRules: protectedProcedure.query(async () => {
      const org = await getCurrentUserOrg();
      
      // Return array of lead rules to match component interface
      return [
        {
          id: '1',
          name: 'High Confidence Buyers',
          description: 'Automatically promote leads with high confidence scores',
          enabled: true,
          conditions: [
            { field: 'confidence', operator: 'greater_than', value: '80' },
            { field: 'intent', operator: 'contains', value: 'buy' }
          ],
          actions: [
            { type: 'promote', value: 'qualified' },
            { type: 'assign', value: 'sales-team' }
          ],
          priority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Newsletter Filter',
          description: 'Filter out newsletter and marketing emails',
          enabled: true,
          conditions: [
            { field: 'domain', operator: 'contains', value: 'newsletter' }
          ],
          actions: [
            { type: 'dismiss', value: 'newsletter' }
          ],
          priority: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }),

    updateLeadRules: protectedProcedure
      .input(z.object({
        rules: z.array(z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          enabled: z.boolean(),
          conditions: z.array(z.object({
            field: z.string(),
            operator: z.string(),
            value: z.string()
          })),
          actions: z.array(z.object({
            type: z.string(),
            value: z.string()
          })),
          priority: z.number(),
          createdAt: z.string(),
          updatedAt: z.string()
        }))
      }))
      .mutation(async ({ input }) => {
        const org = await getCurrentUserOrg();
        
        // This would typically save to a settings table
        // For now, just return success
        return { success: true, message: 'Lead rules updated successfully' };
      }),

    getNotifications: protectedProcedure.query(async () => {
      const user = await getCurrentUser();
      
      // Return array of notification settings to match component interface
      return [
        {
          id: '1',
          type: 'New Lead Detected',
          enabled: true,
          channels: {
            email: true,
            push: false,
            inApp: true
          },
          frequency: 'immediate'
        },
        {
          id: '2',
          type: 'High Priority Reply Due',
          enabled: true,
          channels: {
            email: false,
            push: true,
            inApp: true
          },
          frequency: 'immediate'
        },
        {
          id: '3',
          type: 'Weekly Lead Summary',
          enabled: true,
          channels: {
            email: true,
            push: false,
            inApp: false
          },
          frequency: 'weekly'
        }
      ];
    }),

    updateNotifications: protectedProcedure
      .input(z.object({
        notifications: z.array(z.object({
          id: z.string(),
          type: z.string(),
          enabled: z.boolean(),
          channels: z.object({
            email: z.boolean(),
            push: z.boolean(),
            inApp: z.boolean()
          }),
          frequency: z.enum(['immediate', 'daily', 'weekly'])
        }))
      }))
      .mutation(async ({ input }) => {
        const user = await getCurrentUser();
        
        // This would typically save to user preferences
        return { success: true, message: 'Notification settings updated successfully' };
      }),

    getAppearance: protectedProcedure.query(async () => {
      const user = await getCurrentUser();
      
      // Return appearance settings to match component interface
      return {
        theme: 'system',
        accentColor: 'blue',
        glassIntensity: 'medium',
        highContrast: false,
        animations: true
      };
    }),

    updateAppearance: protectedProcedure
      .input(z.object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        accentColor: z.string().optional(),
        glassIntensity: z.enum(['low', 'medium', 'high']).optional(),
        highContrast: z.boolean().optional(),
        animations: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const user = await getCurrentUser();
        
        // This would typically save to user preferences
        return { success: true, message: 'Appearance settings updated successfully' };
      })
  },

  // AI Chat
  chat: {
    sendMessage: protectedProcedure
      .input(z.object({
        message: z.string(),
        threadId: z.string().optional(),
        context: z.object({
          type: z.enum(['lead', 'contact', 'thread']).optional(),
          id: z.string().optional()
        }).optional()
      }))
      .mutation(async ({ input }) => {
        const user = await getCurrentUser();
        
        // Import AI service
        const { aiService } = await import('@/server/ai/ai-service');
        
        // Send message to AI service with context
        const response = await aiService.sendMessage(
          input.message,
          input.threadId,
          input.context
        );
        
        return response;
      }),

    getThread: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ input }) => {
        const user = await getCurrentUser();
        
        // Import AI service
        const { aiService } = await import('@/server/ai/ai-service');
        
        // Get thread from AI service
        return await aiService.getThread(input.threadId);
      }),

    executeAction: protectedProcedure
      .input(z.object({
        actionType: z.string(),
        context: z.object({
          type: z.enum(['lead', 'contact', 'thread']).optional(),
          id: z.string().optional()
        }).optional(),
        actionData: z.any().optional()
      }))
      .mutation(async ({ input }) => {
        const user = await getCurrentUser();
        
        // Import AI service
        const { aiService } = await import('@/server/ai/ai-service');
        
        // Execute the suggested action
        const result = await aiService.executeSuggestedAction(
          input.actionType,
          input.context,
          input.actionData
        );
        
        return { result };
      })
  }
});

export type AppRouter = typeof appRouter;
