import { Outlet, useParams, useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, Database, BarChart3, BrainCircuit, Lightbulb, FileText, History, Settings, Menu, ChevronLeft, Sparkles } from "lucide-react";

const NAV = [
  { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "data-engineering", label: "Data Engineering", icon: Database },
  { path: "statistics", label: "Statistics", icon: BarChart3 },
  { path: "ml", label: "ML Results", icon: BrainCircuit },
  { path: "strategy", label: "Strategy", icon: Lightbulb },
  { path: "report", label: "Report", icon: FileText },
];

export default function Layout() {
  const { run_id } = useParams();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (path: string) => location.pathname.includes(`/${path}/`);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-slate-900 border-r border-slate-800 flex flex-col transition-all`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              FiveMinds
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-800 rounded">
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {run_id ? NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={`/${item.path}/${run_id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive(item.path) ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }) : <div className="px-3 py-8 text-center text-slate-600 text-sm">{collapsed ? "?" : "Start a new analysis from Home"}</div>}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <History className="w-5 h-5" />
            {!collapsed && <span>History</span>}
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <Settings className="w-5 h-5" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
