import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  User, 
  Building, 
  TrendingUp, 
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Database,
  Mail,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Plus
} from 'lucide-react'

interface TabProps {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
}

function SettingsTab({ id, label, icon, content }: TabProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foam-60 hover:text-foreground hover:bg-depth-200/30 rounded-2xl transition-all duration-200 cursor-pointer">
      {icon}
      {label}
    </div>
  )
}

function LeadRulesPane() {
  const [aliases, setAliases] = React.useState(['john@example.com', 'john.doe@company.com'])
  const [threshold, setThreshold] = React.useState(75)
  const [positiveKeywords, setPositiveKeywords] = React.useState(['buy', 'sell', 'property', 'house', 'condo'])
  const [negativeKeywords, setNegativeKeywords] = React.useState(['spam', 'unsubscribe', 'marketing'])
  const [blocklist, setBlocklist] = React.useState('')

  const addAlias = () => {
    const newAlias = prompt('Enter new email alias:')
    if (newAlias) {
      setAliases([...aliases, newAlias])
    }
  }

  const removeAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index))
  }

  const addPositiveKeyword = () => {
    const keyword = prompt('Enter positive keyword:')
    if (keyword) {
      setPositiveKeywords([...positiveKeywords, keyword])
    }
  }

  const removePositiveKeyword = (index: number) => {
    setPositiveKeywords(positiveKeywords.filter((_, i) => i !== index))
  }

  const addNegativeKeyword = () => {
    const keyword = prompt('Enter negative keyword:')
    if (keyword) {
      setNegativeKeywords([...negativeKeywords, keyword])
    }
  }

  const removeNegativeKeyword = (index: number) => {
    setNegativeKeywords(negativeKeywords.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Aliases */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Email Aliases</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {aliases.map((alias, index) => (
                <Chip key={index} size="sm" className="bg-current-500/20 text-current-500 border-current-500/40">
                  {alias}
                  <button
                    onClick={() => removeAlias(index)}
                    className="ml-1 hover:text-current-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Chip>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addAlias}>
              <Mail className="h-4 w-4 mr-2" />
              Add Alias
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Threshold */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Lead Confidence Threshold</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Minimum confidence: {threshold}%</span>
              <span className="text-xs text-foam-60 font-tabular">~{Math.round(threshold * 1.2)} leads/day</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-depth-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-foam-60">
              <span>50%</span>
              <span>95%</span>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Positive Keywords */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Positive Keywords</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {positiveKeywords.map((keyword, index) => (
                <Chip key={index} size="sm" className="bg-reed-500/20 text-reed-500 border-reed-500/40">
                  {keyword}
                  <button
                    onClick={() => removePositiveKeyword(index)}
                    className="ml-1 hover:text-reed-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Chip>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addPositiveKeyword}>
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Negative Keywords */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Negative Keywords</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {negativeKeywords.map((keyword, index) => (
                <Chip key={index} size="sm" className="bg-red-500/20 text-red-500 border-red-500/40">
                  {keyword}
                  <button
                    onClick={() => removeNegativeKeyword(index)}
                    className="ml-1 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Chip>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addNegativeKeyword}>
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Blocklist */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Blocklist</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <textarea
            value={blocklist}
            onChange={(e) => setBlocklist(e.target.value)}
            placeholder="Enter email addresses or domains to block (one per line)"
            className="w-full h-32 glass rounded-2xl border border-foam-20 bg-depth-100/80 p-3 text-sm placeholder:text-foam-60 focus:border-current-400 focus:outline-none focus:ring-2 focus:ring-current-400/20 resize-none"
          />
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

function IntegrationsPane() {
  const integrations = [
    {
      name: 'Gmail',
      icon: <Mail className="h-5 w-5" />,
      status: 'connected' as const,
      scopes: ['Read emails', 'Send emails', 'Calendar access'],
      lastSync: '2 minutes ago'
    },
    {
      name: 'Google Calendar',
      icon: <Calendar className="h-5 w-5" />,
      status: 'connected' as const,
      scopes: ['Read events', 'Create events'],
      lastSync: '1 minute ago'
    },
    {
      name: 'Outlook',
      icon: <Mail className="h-5 w-5" />,
      status: 'disconnected' as const,
      scopes: ['Read emails', 'Send emails'],
      lastSync: 'Never'
    }
  ]

  return (
    <div className="space-y-6">
      {integrations.map((integration) => (
        <GlassCard key={integration.name}>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {integration.icon}
                <div>
                  <GlassCardTitle className="text-base">{integration.name}</GlassCardTitle>
                  <p className="text-sm text-foam-60">Last sync: {integration.lastSync}</p>
                </div>
              </div>
              <Chip 
                size="sm" 
                className={integration.status === 'connected' 
                  ? "bg-reed-500/20 text-reed-500 border-reed-500/40" 
                  : "bg-red-500/20 text-red-500 border-red-500/40"
                }
              >
                {integration.status === 'connected' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {integration.status}
              </Chip>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {integration.scopes.map((scope) => (
                  <Chip key={scope} size="sm" className="bg-depth-300/50 text-foam-80 border-depth-400">
                    {scope}
                  </Chip>
                ))}
              </div>
              <Button variant="outline" size="sm">
                {integration.status === 'connected' ? 'Reconnect' : 'Connect'}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      ))}
    </div>
  )
}

function AppearancePane() {
  const [accentColor, setAccentColor] = React.useState('#6366f1')
  const [darkMode, setDarkMode] = React.useState(true)

  const colors = [
    '#6366f1', // current
    '#22c55e', // reed
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
  ]

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Accent Color</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all duration-200",
                    accentColor === color ? "border-foam-60 scale-110" : "border-foam-20 hover:border-foam-40"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-sm text-foam-60">
              This updates the primary accent color throughout the application.
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Dark Mode</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Enable dark mode</span>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

export function SettingsLocksDams() {
  const [activeTab, setActiveTab] = React.useState('lead-rules')

  const tabs: TabProps[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      content: <div className="text-foam-60">Profile settings content</div>
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: <Building className="h-4 w-4" />,
      content: <div className="text-foam-60">Organization settings content</div>
    },
    {
      id: 'lead-rules',
      label: 'Lead Rules',
      icon: <TrendingUp className="h-4 w-4" />,
      content: <LeadRulesPane />
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <SettingsIcon className="h-4 w-4" />,
      content: <IntegrationsPane />
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-4 w-4" />,
      content: <div className="text-foam-60">Security settings content</div>
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      content: <div className="text-foam-60">Notification settings content</div>
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Palette className="h-4 w-4" />,
      content: <AppearancePane />
    },
    {
      id: 'data-privacy',
      label: 'Data & Privacy',
      icon: <Database className="h-4 w-4" />,
      content: <div className="text-foam-60">Data & privacy settings content</div>
    }
  ]

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className="h-screen flex">
      {/* Left Tabs */}
      <div className="w-64 glass border-r border-foam-20 p-4">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "transition-all duration-200",
                activeTab === tab.id && "bg-current-500/10 text-current-500 border-l-2 border-current-500"
              )}
            >
              <SettingsTab {...tab} />
            </div>
          ))}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeContent}
      </div>
    </div>
  )
}
