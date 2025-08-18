import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Search } from '@/components/ui/search'
import { 
  Plus, 
  Filter, 
  Users, 
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface DealCardProps {
  id: string
  name: string
  snippet: string
  intent: 'buyer' | 'seller' | 'renter'
  confidence: 70 | 80 | 90 | 100
  task?: string
  overdue?: boolean
  value?: string
}

function DealCard({ name, snippet, intent, confidence, task, overdue, value }: DealCardProps) {
  return (
    <div className={cn(
      "glass p-4 rounded-2xl rippleHover cursor-pointer transition-all duration-200",
      overdue && "border-l-4 border-l-red-500"
    )}>
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm">{name}</h4>
          <p className="text-xs text-foam-60 mt-1 line-clamp-2">{snippet}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Chip intent={intent} confidence={confidence} size="sm">
              {intent}
            </Chip>
            {task && (
              <Chip size="sm" className="bg-depth-300/50 text-foam-80 border-depth-400">
                {task}
              </Chip>
            )}
          </div>
          {value && (
            <span className="text-xs font-medium text-current-500">{value}</span>
          )}
        </div>
        
        {overdue && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </div>
        )}
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  title: string
  deals: DealCardProps[]
  color: string
  count: number
  sla?: string
}

function KanbanColumn({ title, deals, color, count, sla }: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Glass Header */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs bg-foam-20 px-2 py-1 rounded-full">{count}</span>
        </div>
        
        {/* SLA Heat Strip */}
        {sla && (
          <div className="relative h-1 bg-depth-200 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 rounded-full"
              style={{ 
                background: `linear-gradient(90deg, ${color} 0%, ${color}40 100%)`,
                width: sla === 'hot' ? '100%' : sla === 'warm' ? '60%' : '30%'
              }}
            />
          </div>
        )}
      </div>
      
      {/* Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {deals.map((deal) => (
          <DealCard key={deal.id} {...deal} />
        ))}
        
        {/* Empty State */}
        {deals.length === 0 && (
          <div className="glass border-2 border-dashed border-foam-20 rounded-2xl p-8 text-center">
            <div className="text-foam-40 mb-2">No deals here</div>
            <div className="text-xs text-foam-60">Drop zone for new deals</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineRiverbanks() {
  const columns: KanbanColumnProps[] = [
    {
      title: "Prospects",
      color: "#6366f1",
      count: 12,
      sla: "warm",
      deals: [
        {
          id: "1",
          name: "John Smith",
          snippet: "Interested in 3-bedroom property downtown",
          intent: "buyer",
          confidence: 95,
          value: "$500k"
        },
        {
          id: "2",
          name: "Sarah Johnson",
          snippet: "Looking to sell 2-bedroom condo",
          intent: "seller",
          confidence: 88,
          task: "Schedule call"
        }
      ]
    },
    {
      title: "Qualified",
      color: "#22c55e",
      count: 8,
      sla: "hot",
      deals: [
        {
          id: "3",
          name: "Mike Wilson",
          snippet: "Ready to make offer on 4-bedroom house",
          intent: "buyer",
          confidence: 100,
          value: "$750k",
          overdue: true
        }
      ]
    },
    {
      title: "Proposal",
      color: "#f59e0b",
      count: 5,
      sla: "hot",
      deals: [
        {
          id: "4",
          name: "Lisa Brown",
          snippet: "Reviewing contract for downtown condo",
          intent: "buyer",
          confidence: 92,
          value: "$450k"
        }
      ]
    },
    {
      title: "Negotiation",
      color: "#ef4444",
      count: 3,
      sla: "warm",
      deals: [
        {
          id: "5",
          name: "David Lee",
          snippet: "Counter-offer on price and terms",
          intent: "seller",
          confidence: 85,
          value: "$600k"
        }
      ]
    },
    {
      title: "Closed",
      color: "#10b981",
      count: 15,
      deals: [
        {
          id: "6",
          name: "Emma Davis",
          snippet: "Successfully closed on 3-bedroom house",
          intent: "buyer",
          confidence: 100,
          value: "$550k"
        }
      ]
    }
  ]

  return (
    <div className="h-screen flex flex-col">
      {/* Board Toolbar */}
      <div className="glass border-b border-foam-20 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Search placeholder="Search deals..." className="w-64" />
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Group by
            </Button>
          </div>
          <Button className="currentDrift">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-5 gap-6 h-full">
          {columns.map((column) => (
            <KanbanColumn key={column.title} {...column} />
          ))}
        </div>
      </div>
    </div>
  )
}
