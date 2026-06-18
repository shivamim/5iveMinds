import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, History, Settings, BrainCircuit } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideSidebar = ['/', '/upload', '/ask'].includes(location.pathname);

  if (hideSidebar) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-muted/30 p-4 hidden md:block">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" />
            FiveMinds
          </h1>
        </div>
        <nav className="space-y-2">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" isActive={location.pathname === '/dashboard'} />
          <NavItem to="/data-engineering" icon={<Database className="w-5 h-5" />} label="Data Engineering" isActive={location.pathname === '/data-engineering'} />
          <NavItem to="/history" icon={<History className="w-5 h-5" />} label="History" isActive={location.pathname === '/history'} />
          <NavItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" isActive={location.pathname === '/settings'} />
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, isActive }: { to: string; icon: React.ReactNode; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
