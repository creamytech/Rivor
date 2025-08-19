import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { getUpcomingEvents } from "@/server/calendar";
import { prisma } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

async function getOrgId(): Promise<string> {
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

export default async function ShowingsCalendar() {
  const orgId = await getOrgId();
  const events = await getUpcomingEvents(orgId, 20);

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Showings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-400">No upcoming showings</p>
        )}
        {events.map(event => {
          const leadId = event.attendees?.startsWith("lead:")
            ? event.attendees.split(":")[1]
            : undefined;
          return (
            <div key={event.id} className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {event.title || "Untitled Showing"}
              </p>
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(event.start).toLocaleString()}
              </div>
              {event.location && (
                <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              )}
              {leadId && (
                <Link
                  href={`/app/pipeline?lead=${leadId}`}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" /> View lead
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
