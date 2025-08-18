import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { 
  Send, 
  Lightbulb, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'

interface MessageProps {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  reasoning?: string
  stats?: Record<string, string>
}

function Message({ content, isUser, timestamp, reasoning, stats }: MessageProps) {
  const [showReasoning, setShowReasoning] = React.useState(false)

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] space-y-2",
        isUser ? "order-2" : "order-1"
      )}>
        <div className={cn(
          "glass p-4 rounded-2xl",
          isUser ? "bg-current-500/10 border-current-500/20" : "bg-depth-200/50"
        )}>
          <p className="text-sm leading-relaxed">{content}</p>
          
          {stats && (
            <div className="mt-3 p-3 bg-depth-300/30 rounded-xl font-mono text-xs space-y-1">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-foam-60">{key}:</span>
                  <span className="font-tabular">{value}</span>
                </div>
              ))}
            </div>
          )}
          
          {reasoning && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReasoning(!showReasoning)}
                className="text-xs text-foam-60 hover:text-foreground"
              >
                {showReasoning ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showReasoning ? "Hide reasoning" : "Show reasoning"}
              </Button>
              
              {showReasoning && (
                <div className="mt-2 p-3 border border-foam-20 rounded-xl bg-depth-300/20">
                  <p className="text-xs text-foam-60 leading-relaxed">{reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={cn(
          "text-xs text-foam-60",
          isUser ? "text-right" : "text-left"
        )}>
          {timestamp}
        </div>
      </div>
    </div>
  )
}

export function ChatGuide() {
  const [inputValue, setInputValue] = React.useState("")
  const [context] = React.useState("Property inquiry – 123 Main St")

  const messages: MessageProps[] = [
    {
      id: "1",
      content: "Hi! I can help you with your property inquiry about 123 Main St. What would you like to know?",
      isUser: false,
      timestamp: "2:30 PM",
      reasoning: "Identified the property context from the breadcrumb and provided a welcoming, helpful response to encourage engagement."
    },
    {
      id: "2",
      content: "What's the current market value for this property?",
      isUser: true,
      timestamp: "2:31 PM"
    },
    {
      id: "3",
      content: "Based on recent comparable sales in the area, 123 Main St has an estimated market value of $485,000 - $520,000. The property last sold in 2019 for $420,000, showing a 15-24% appreciation over 4 years.",
      isUser: false,
      timestamp: "2:32 PM",
      stats: {
        "Est. Value": "$485k - $520k",
        "Last Sale": "$420k (2019)",
        "Appreciation": "15-24%",
        "Comps": "3 properties"
      },
      reasoning: "Analyzed recent sales data, calculated appreciation rate, and provided a range to account for market fluctuations. Included key statistics for transparency."
    }
  ]

  const quickActions = [
    { label: "Summarize this week", icon: <Lightbulb className="h-4 w-4" /> },
    { label: "Find leads", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
    { label: "Draft reply", icon: <MessageSquare className="h-4 w-4" /> }
  ]

  const handleSend = () => {
    if (inputValue.trim()) {
      // Handle sending message
      console.log("Sending:", inputValue)
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-foam-20 p-4">
        <div className="flex items-center gap-2 text-sm text-foam-60 mb-2">
          <span>Assisting using:</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{context}</span>
        </div>
        <h1 className="text-xl font-semibold gradient-text">AI Assistant</h1>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-foam-20">
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Chip
              key={action.label}
              size="sm"
              className="cursor-pointer hover:bg-depth-200/50 transition-colors"
            >
              {action.icon}
              {action.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {messages.map((message) => (
          <Message key={message.id} {...message} />
        ))}
      </div>

      {/* Composer */}
      <div className="p-4 border-t border-foam-20">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full glass rounded-2xl border border-foam-20 bg-depth-100/80 px-4 py-3 text-sm placeholder:text-foam-60 focus:border-current-400 focus:outline-none focus:ring-2 focus:ring-current-400/20 transition-all duration-200"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="currentDrift"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
