import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, History, Settings, BrainCircuit } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm hidden md:flex md:flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <BrainCircuit className="w-6 h-6 text-blue-600 mr-2" />
          <span className="font-bold text-xl text-gray-900 tracking-tight">FiveMinds</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" isActive={location.pathname === '/dashboard'} />
          <NavItem to="/data-engineering" icon={<Database className="w-5 h-5" />} label="Data Engineering" isActive={location.pathname === '/data-engineering'} />
          <NavItem to="/history" icon={<History className="w-5 h-5" />} label="Run History" isActive={location.pathname === '/history'} />
          <NavItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" isActive={location.pathname === '/settings'} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 shadow-sm z-10">
           <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
             S
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, isActive }: { to: string; icon: React.ReactNode; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{icon}</span>
      {label}
    </Link>
  );
}
