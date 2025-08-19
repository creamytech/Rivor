import { router, protectedProcedure } from "./api/trpc";
import { z } from "zod";
import { prisma } from "./db";
import { encryptForOrg } from "./crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

async function getCurrentOrgId() {
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
  const org = user?.orgMembers?.[0]?.org;
  if (!org) {
    throw new Error("No organization found");
  }
  return org.id;
}

export const showingsRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      start: z.date(),
      end: z.date(),
      location: z.string().optional(),
      attendees: z.array(z.string()).optional(),
      leadId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const orgId = await getCurrentOrgId();
      const account = await prisma.calendarAccount.findFirst({
        where: { orgId },
        select: { id: true }
      });
      if (!account) {
        throw new Error("No calendar account found");
      }
      const event = await prisma.calendarEvent.create({
        data: {
          orgId,
          accountId: account.id,
          start: input.start,
          end: input.end,
          titleEnc: await encryptForOrg(orgId, input.title, "calendar:title"),
          locationEnc: input.location
            ? await encryptForOrg(orgId, input.location, "calendar:location")
            : null,
          notesEnc: input.leadId
            ? await encryptForOrg(orgId, `lead:${input.leadId}`, "calendar:notes")
            : null,
          attendeesEnc: input.attendees
            ? await encryptForOrg(orgId, input.attendees.join(","), "calendar:attendees")
            : null,
        },
      });

      let followUpTask = null as any;
      if (input.leadId) {
        followUpTask = await prisma.task.create({
          data: {
            orgId,
            title: `Follow up after showing`,
            dueAt: new Date(input.end.getTime() + 60 * 60 * 1000),
            linkLeadId: input.leadId,
            description: `event:${event.id}`,
          },
        });
      }

      return { event, followUpTask };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      start: z.date().optional(),
      end: z.date().optional(),
      location: z.string().optional(),
      attendees: z.array(z.string()).optional(),
      leadId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const orgId = await getCurrentOrgId();
      const data: any = {};
      if (input.title !== undefined) {
        data.titleEnc = await encryptForOrg(orgId, input.title, "calendar:title");
      }
      if (input.start !== undefined) data.start = input.start;
      if (input.end !== undefined) data.end = input.end;
      if (input.location !== undefined) {
        data.locationEnc = await encryptForOrg(orgId, input.location, "calendar:location");
      }
      if (input.attendees !== undefined) {
        data.attendeesEnc = await encryptForOrg(orgId, input.attendees.join(","), "calendar:attendees");
      }
      if (input.leadId !== undefined) {
        data.notesEnc = await encryptForOrg(orgId, `lead:${input.leadId}`, "calendar:notes");
      }

      const event = await prisma.calendarEvent.update({
        where: { id: input.id, orgId },
        data,
      });

      const existingTask = await prisma.task.findFirst({
        where: { orgId, description: `event:${input.id}` },
      });
      let followUpTask = null as any;
      if (existingTask) {
        followUpTask = await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            dueAt: input.end
              ? new Date(input.end.getTime() + 60 * 60 * 1000)
              : existingTask.dueAt,
            linkLeadId: input.leadId ?? existingTask.linkLeadId,
          },
        });
      }

      return { event, followUpTask };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const orgId = await getCurrentOrgId();
      await prisma.calendarEvent.delete({ where: { id: input.id, orgId } });
      await prisma.task.deleteMany({ where: { orgId, description: `event:${input.id}` } });
      return { success: true };
    }),
});
