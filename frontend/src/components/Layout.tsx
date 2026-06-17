import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  BrainCircuit,
  Lightbulb,
  FileText,
  History,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/data-engineering', icon: Database, label: 'Data Engineering' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/ml-results', icon: BrainCircuit, label: 'ML Results' },
  { to: '/strategy', icon: Lightbulb, label: 'Strategy' },
  { to: '/report', icon: FileText, label: 'Report' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-full',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
          <Zap className="w-7 h-7 text-blue-600 flex-shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900 tracking-tight">FiveMinds</span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'hover:bg-gray-100',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              S
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Shivam Shukla</p>
                <p className="text-xs text-gray-500 truncate">shivam@fiveminds.ai</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-2 border-t border-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
