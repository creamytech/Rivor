import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Search } from '@/components/ui/search'
import { 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  Clock,
  User,
  Building,
  MapPin,
  Star
} from 'lucide-react'

interface ThreadItemProps {
  id: string
  subject: string
  snippet: string
  sender: string
  timestamp: string
  unread: boolean
  intent?: 'buyer' | 'seller' | 'renter'
  confidence?: 70 | 80 | 90 | 100
  hasPhone?: boolean
  hasTimes?: boolean
}

function ThreadItem({ 
  subject, 
  snippet, 
  sender, 
  timestamp, 
  unread, 
  intent, 
  confidence,
  hasPhone,
  hasTimes
}: ThreadItemProps) {
  return (
    <div className={cn(
      "group flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 rippleHover cursor-pointer",
      unread ? "bg-current-500/5 border-l-2 border-current-500" : "hover:bg-depth-200/30"
    )}>
      <div className="w-10 h-10 rounded-full bg-depth-300 flex items-center justify-center text-sm font-medium">
        {sender.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={cn(
              "font-medium text-sm truncate",
              unread ? "text-foreground" : "text-foam-80"
            )}>
              {subject}
            </h4>
            <p className="text-sm text-foam-60 mt-1 line-clamp-2">{snippet}</p>
          </div>
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
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-foam-60">{sender}</span>
          {intent && confidence && (
            <Chip intent={intent} confidence={confidence} size="sm">
              {intent}
            </Chip>
          )}
          {hasPhone && (
            <Chip size="sm" className="bg-reed-500/20 text-reed-500 border-reed-500/40">
              <Phone className="h-3 w-3" />
            </Chip>
          )}
          {hasTimes && (
            <Chip size="sm" className="bg-current-500/20 text-current-500 border-current-500/40">
              <Clock className="h-3 w-3" />
            </Chip>
          )}
          <span className="text-xs text-foam-60 ml-auto">{timestamp}</span>
        </div>
      </div>
    </div>
  )
}

interface LeadSummaryProps {
  contact: {
    name: string
    email: string
    phone?: string
    company?: string
    location?: string
  }
  entities: string[]
  reasons: string[]
}

function LeadSummary({ contact, entities, reasons }: LeadSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Contact
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          <div>
            <h4 className="font-medium">{contact.name}</h4>
            <p className="text-sm text-foam-60">{contact.email}</p>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-foam-60" />
              {contact.phone}
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-foam-60" />
              {contact.company}
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-foam-60" />
              {contact.location}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Entities */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Entities</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <Chip key={index} size="sm">
                {entity}
              </Chip>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Why Lead */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Why Lead</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-2">
            {reasons.map((reason, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <Star className="h-3 w-3 text-current-500 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

export function InboxMainCurrent() {
  const [activeTab, setActiveTab] = React.useState<'leads' | 'review' | 'other'>('leads')
  const [selectedThread, setSelectedThread] = React.useState<string | null>(null)

  const threads: ThreadItemProps[] = [
    {
      id: "1",
      subject: "Interested in 3-bedroom property",
      snippet: "Hi, I'm looking for a 3-bedroom property in the downtown area. Budget is around $500k. Can you help?",
      sender: "John Doe",
      timestamp: "2 min ago",
      unread: true,
      intent: "buyer",
      confidence: 95,
      hasPhone: true
    },
    {
      id: "2",
      subject: "Property listing inquiry",
      snippet: "I have a 2-bedroom condo I'd like to list. What's the current market like?",
      sender: "Sarah Miller",
      timestamp: "15 min ago",
      unread: false,
      intent: "seller",
      confidence: 88,
      hasTimes: true
    },
    {
      id: "3",
      subject: "Rental property available",
      snippet: "I have a 1-bedroom apartment available for rent starting next month. $2,200/month.",
      sender: "Alex Lee",
      timestamp: "1 hour ago",
      unread: false,
      intent: "renter",
      confidence: 92
    }
  ]

  const savedFilters = [
    { label: "New senders", count: 12 },
    { label: "Has phone #", count: 8 },
    { label: "Has times", count: 5 }
  ]

  const leadSummary: LeadSummaryProps = {
    contact: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      company: "Tech Corp",
      location: "San Francisco, CA"
    },
    entities: ["3-bedroom", "downtown", "$500k", "property"],
    reasons: [
      "Mentioned specific budget ($500k)",
      "Looking for specific property type (3-bedroom)",
      "Provided location preference (downtown)",
      "Expressed urgency in inquiry"
    ]
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="glass border-b border-foam-20 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'leads' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('leads')}
            >
              Leads
            </Button>
            <Button
              variant={activeTab === 'review' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('review')}
            >
              Review
            </Button>
            <Button
              variant={activeTab === 'other' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('other')}
            >
              Other
            </Button>
          </div>
          <Search placeholder="Search threads..." className="w-64" />
        </div>
        
        {/* Saved Filters */}
        <div className="flex gap-2">
          {savedFilters.map((filter) => (
            <Chip key={filter.label} size="sm" className="cursor-pointer hover:bg-depth-200/50">
              {filter.label}
              <span className="ml-1 text-xs bg-foam-20 px-1 rounded">{filter.count}</span>
            </Chip>
          ))}
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex">
        {/* Left List */}
        <div className="w-1/3 border-r border-foam-20 overflow-y-auto">
          <div className="p-4 space-y-2">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                {...thread}
                onClick={() => setSelectedThread(thread.id)}
              />
            ))}
          </div>
        </div>

        {/* Center Thread */}
        <div className="flex-1 p-6">
          {selectedThread ? (
            <div className="space-y-4">
              <div className="glass p-6 rounded-2xl">
                <h2 className="text-xl font-semibold gradient-text mb-4">
                  Interested in 3-bedroom property
                </h2>
                <div className="prose prose-sm text-foam-80">
                  <p>
                    Hi there,
                  </p>
                  <p>
                    I'm looking for a 3-bedroom property in the downtown area. My budget is around $500k and I'm hoping to find something with good amenities and close to public transportation.
                  </p>
                  <p>
                    Can you help me find something that fits these criteria? I'm available for viewings on weekends.
                  </p>
                  <p>
                    Thanks,<br />
                    John
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-foam-60">
              Select a thread to view
            </div>
          )}
        </div>

        {/* Right Lead Summary */}
        <div className="w-80 border-l border-foam-20 p-6 overflow-y-auto">
          {selectedThread ? (
            <LeadSummary {...leadSummary} />
          ) : (
            <div className="text-center text-foam-60">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a thread to see lead details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
