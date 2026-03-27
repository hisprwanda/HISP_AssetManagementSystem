import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Laptop,
  ClipboardCheck,
  AlertTriangle,
  Users,
  LogOut,
  Search,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/assets', icon: Laptop },
    { name: 'Requests', path: '/requests', icon: ClipboardCheck },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { name: 'Staff', path: '/users', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans text-slate-900">
      <aside className="w-64 bg-hisp-dark text-white flex flex-col shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg shadow-inner">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDiC5rBaWuabdf-FTUqrwzSQ_jrQWw-o3U7g&s"
              alt="HISP Rwanda"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight">
              HISP-AMS
            </span>
            <span className="text-[10px] uppercase tracking-widest text-blue-200 opacity-80">
              Asset Management
            </span>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-hisp transition-all duration-200 group ${
                  isActive
                    ? 'bg-hisp-primary text-white shadow-lg'
                    : 'text-blue-100 hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-5 h-5 opacity-80 group-hover:opacity-100" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Quick-Card */}
        <div className="p-4 m-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-hisp-primary flex items-center justify-center font-bold border border-white/20">
              {user?.first_name?.charAt(0)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold truncate">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-[10px] text-blue-300 uppercase font-bold">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-200 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Smart Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm">
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-hisp-primary transition-colors" />
            <input
              type="text"
              placeholder="Search assets by serial, tag, or user..."
              className="w-full bg-slate-50 border-none rounded-full pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-hisp-primary/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                System Health
              </span>
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />{' '}
                Connected
              </span>
            </div>
            <button className="p-2.5 rounded-full bg-slate-50 text-slate-600 hover:bg-hisp-accent hover:text-hisp-primary transition-all">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
