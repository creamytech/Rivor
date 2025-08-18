import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Search } from '@/components/ui/search'
import { 
  Home, 
  Inbox, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  MessageSquare,
  TrendingUp,
  Building2,
  ChevronLeft,
  Menu
} from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showSearch?: boolean
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

const navigation = [
  { name: 'Dashboard', href: '/app', icon: Home, count: null },
  { name: 'Inbox', href: '/app/inbox', icon: Inbox, count: 12 },
  { name: 'Pipeline', href: '/app/pipeline', icon: TrendingUp, count: 8 },
  { name: 'Contacts', href: '/app/contacts', icon: Users, count: null },
  { name: 'Calendar', href: '/app/calendar', icon: Calendar, count: 3 },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3, count: null },
  { name: 'Chat', href: '/app/chat', icon: MessageSquare, count: 5 },
  { name: 'Settings', href: '/app/settings', icon: Settings, count: null },
]

export function AppShell({ 
  children, 
  title = "Dashboard",
  subtitle = "Here's what's flowing today",
  showSearch = true,
  primaryAction
}: AppShellProps) {
  const [isNavCollapsed, setIsNavCollapsed] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-depth-0">
      {/* App Bar */}
      <header className={cn(
        "sticky top-0 z-50 glass border-b border-foam-20 transition-all duration-300",
        isScrolled ? "py-2" : "py-4"
      )}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-2xl currentDrift" />
              <div className="hidden sm:block">
                <h1 className={cn(
                  "font-semibold gradient-text transition-all duration-300",
                  isScrolled ? "text-lg" : "text-xl"
                )}>
                  {title}
                </h1>
                {!isScrolled && subtitle && (
                  <p className="text-sm text-foam-60">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="hidden md:block w-64">
                <Search placeholder="Search anything..." />
              </div>
            )}
            
            {primaryAction && (
              <Button onClick={primaryAction.onClick} className="currentDrift">
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation */}
        <nav className={cn(
          "fixed left-0 top-0 z-40 h-full glass border-r border-foam-20 transition-all duration-300 lg:relative",
          isNavCollapsed ? "w-16" : "w-64",
          "lg:translate-x-0",
          isNavCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}>
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const isActive = window.location.pathname === item.href
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200",
                      "hover:bg-depth-200/50 hover:text-foreground",
                      isActive 
                        ? "bg-current-500/10 text-current-500 border-l-2 border-current-500" 
                        : "text-foam-60"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isNavCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.count !== null && (
                          <span className="chip text-xs">
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </a>
                )
              })}
            </div>
            
            <div className="p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                className="hidden lg:flex w-full justify-center"
              >
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isNavCollapsed && "rotate-180"
                )} />
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}


