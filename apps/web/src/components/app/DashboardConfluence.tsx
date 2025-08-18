import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Progress } from '@/components/ui/progress'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  MessageSquare, 
  Calendar, 
  AlertTriangle,
  Mail,
  Clock,
  Users,
  ArrowRight,
  Activity
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: string
  icon: React.ReactNode
  sparkline?: number[]
}

function StatCard({ title, value, change, icon, sparkline }: StatCardProps) {
  return (
    <GlassCard className="rippleHover">
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <GlassCardTitle className="text-sm font-medium text-foam-60">
          {title}
        </GlassCardTitle>
        {icon}
      </GlassCardHeader>
      <GlassCardContent>
        <div className="text-2xl font-bold font-tabular">{value}</div>
        {change && (
          <p className="text-xs text-foam-60">
            {change}
          </p>
        )}
        {sparkline && (
          <div className="mt-2 flex items-center gap-1">
            {sparkline.map((point, i) => (
              <div
                key={i}
                className="h-1 bg-current-500/20 rounded-full"
                style={{ width: `${point}%` }}
              />
            ))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  )
}

interface SyncCardProps {
  title: string
  progress: number
  status: 'healthy' | 'warning' | 'error'
  eta?: string
}

function SyncCard({ title, progress, status, eta }: SyncCardProps) {
  const statusColors = {
    healthy: 'text-reed-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  }

  return (
    <GlassCard className="rippleHover">
      <GlassCardHeader className="pb-2">
        <GlassCardTitle className="text-sm font-medium">{title}</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-2">
        <Progress value={progress} className="h-1" />
        <div className="flex items-center justify-between text-xs">
          <span className={cn("flex items-center gap-1", statusColors[status])}>
            <div className={cn("w-2 h-2 rounded-full", statusColors[status].replace('text-', 'bg-'))} />
            {status}
          </span>
          {eta && <span className="text-foam-60">{eta}</span>}
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}

interface LeadItemProps {
  id: string
  subject: string
  snippet: string
  intent: 'buyer' | 'seller' | 'renter'
  confidence: 70 | 80 | 90 | 100
  timestamp: string
  avatar?: string
}

function LeadItem({ subject, snippet, intent, confidence, timestamp, avatar }: LeadItemProps) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-2xl hover:bg-depth-200/30 transition-all duration-200 rippleHover">
      <div className="w-8 h-8 rounded-full bg-depth-300 flex items-center justify-center text-xs font-medium">
        {avatar || 'JD'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{subject}</h4>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <TrendingUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-foam-60 mt-1 line-clamp-2">{snippet}</p>
        <div className="flex items-center gap-2 mt-2">
          <Chip intent={intent} confidence={confidence} size="sm">
            {intent}
          </Chip>
          <span className="text-xs text-foam-60">{timestamp}</span>
        </div>
      </div>
    </div>
  )
}

export function DashboardConfluence() {
  const stats = [
    {
      title: "Leads",
      value: "1,234",
      change: "+12% from last week",
      icon: <TrendingUp className="h-4 w-4 text-current-500" />,
      sparkline: [20, 45, 30, 60, 40, 80, 70]
    },
    {
      title: "Replies due",
      value: "23",
      change: "5 overdue",
      icon: <MessageSquare className="h-4 w-4 text-yellow-500" />,
      sparkline: [10, 30, 20, 50, 40, 60, 45]
    },
    {
      title: "Meetings",
      value: "8",
      change: "Next: 2:30 PM",
      icon: <Calendar className="h-4 w-4 text-reed-500" />,
      sparkline: [15, 25, 35, 20, 40, 30, 50]
    },
    {
      title: "Auth issues",
      value: "2",
      change: "Gmail sync failed",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      sparkline: [0, 0, 10, 0, 5, 0, 15]
    }
  ]

  const syncData = [
    { title: "Email", progress: 85, status: 'healthy' as const, eta: "2 min" },
    { title: "Calendar", progress: 92, status: 'healthy' as const, eta: "1 min" },
    { title: "Contacts", progress: 45, status: 'warning' as const, eta: "5 min" }
  ]

  const leads = [
    {
      id: "1",
      subject: "Interested in 3-bedroom property",
      snippet: "Hi, I'm looking for a 3-bedroom property in the downtown area. Budget is around $500k. Can you help?",
      intent: "buyer" as const,
      confidence: 95,
      timestamp: "2 min ago",
      avatar: "JD"
    },
    {
      id: "2", 
      subject: "Property listing inquiry",
      snippet: "I have a 2-bedroom condo I'd like to list. What's the current market like?",
      intent: "seller" as const,
      confidence: 88,
      timestamp: "15 min ago",
      avatar: "SM"
    },
    {
      id: "3",
      subject: "Rental property available",
      snippet: "I have a 1-bedroom apartment available for rent starting next month. $2,200/month.",
      intent: "renter" as const,
      confidence: 92,
      timestamp: "1 hour ago",
      avatar: "AL"
    }
  ]

  return (
    <div className="container py-6 space-y-6">
      {/* Greeting Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text currentDrift">
          Good morning, John
        </h1>
        <p className="text-lg text-foam-60">
          Here's what's flowing today
        </p>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Center */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold gradient-text">Sync Center</h2>
            <Activity className="h-4 w-4 text-foam-60" />
          </div>
          <div className="space-y-3">
            {syncData.map((sync, index) => (
              <SyncCard key={index} {...sync} />
            ))}
          </div>
        </div>

        {/* Lead Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold gradient-text">Lead Feed</h2>
            <Button variant="ghost" size="sm" className="text-foam-60">
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button variant="default" size="sm" className="text-xs">
              Leads
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              Review
            </Button>
          </div>

          <div className="space-y-2">
            {leads.map((lead) => (
              <LeadItem key={lead.id} {...lead} />
            ))}
          </div>
        </div>
      </div>

      {/* Health Card */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>System Health</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-reed-500" />
                <span className="text-sm">Gmail</span>
              </div>
              <Chip intent="buyer" size="sm">Healthy</Chip>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-current-500" />
                <span className="text-sm">Calendar</span>
              </div>
              <Chip intent="seller" size="sm">Healthy</Chip>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
