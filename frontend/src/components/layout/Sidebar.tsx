import { useStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Brain,
  Lightbulb,
  FileText,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Database, label: 'Data Engineering', path: '/dashboard/data' },
  { icon: BarChart3, label: 'Statistics', path: '/dashboard/stats' },
  { icon: Brain, label: 'ML Results', path: '/dashboard/ml' },
  { icon: Lightbulb, label: 'Strategy', path: '/dashboard/strategy' },
  { icon: FileText, label: 'Report', path: '/dashboard/report' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen ? (
            <Link to="/" className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold gradient-text">FiveMinds</span>
            </Link>
          ) : (
            <Zap className="h-6 w-6 text-primary mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1 hover:bg-accent"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <div className={cn('flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2', !sidebarOpen && 'justify-center')}>            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">S</span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">Shivam Shukla</p>
                <p className="text-xs text-muted-foreground truncate">shivam@fiveminds.ai</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
