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
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Database, label: 'Data Engineering', path: '/data-engineering' },
  { icon: BarChart3, label: 'Statistics', path: '/statistics' },
  { icon: Brain, label: 'ML Results', path: '/ml-results' },
  { icon: Lightbulb, label: 'Strategy', path: '/strategy' },
  { icon: FileText, label: 'Report', path: '/report' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'border-r bg-background transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-12 items-center justify-end border-b px-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-md p-1 hover:bg-accent"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      <nav className="space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                !sidebarOpen && 'justify-center px-2'
              )}
              title={item.label}
            >
              <Icon size={20} />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
