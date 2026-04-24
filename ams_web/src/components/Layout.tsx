import { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Laptop,
  ClipboardCheck,
  AlertTriangle,
  Users,
  LogOut,
  Search,
  User as UserIcon,
  X,
  History,
  ArrowRight,
  Plus,
  ShieldAlert,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { SimpleRequestModal } from './SimpleRequestModal';
import { ReportAssetIncidentModal } from './ReportAssetIncidentModal';
import { NotificationBell } from './NotificationBell';

interface SearchResult {
  id: string;
  name: string;
  type: 'asset' | 'user';
  subtitle: string;
  path: string;
}

interface SearchAsset {
  id: string;
  name: string;
  serial_number: string;
  tag_id?: string;
}

interface SearchUser {
  id: string;
  full_name: string;
  email: string;
}

interface NavItem {
  name: string;
  path?: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export const Layout = () => {
  const { user, logout, isAdmin, isHOD, isCEO } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOverviewPage = location.pathname === '/overview';

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
    enabled: showResults && searchQuery.length > 1,
  });

  const { data: staff } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: showResults && searchQuery.length > 1,
  });

  const { data: allIncidents } = useQuery({
    queryKey: ['asset-incidents', 'badge'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
    enabled: isAdmin || isCEO,
    refetchInterval: 30000,
  });

  const pendingIncidentsCount = useMemo(() => {
    if (!allIncidents || !user) return 0;
    if (isCEO) {
      return allIncidents.filter(
        (i: { investigation_status: string }) =>
          i.investigation_status === 'CEO_REVIEW',
      ).length;
    }
    return allIncidents.filter(
      (i: { investigation_status: string }) =>
        i.investigation_status === 'INVESTIGATING',
    ).length;
  }, [allIncidents, isCEO, user]);

  const { data: hodRequests } = useQuery({
    queryKey: ['assets-requests', 'badge'],
    queryFn: async () => {
      const response = await api.get('/assets-requests');
      return response.data;
    },
    enabled: isHOD || isAdmin || isCEO,
    refetchInterval: 30000,
  });

  const pendingRequestsCount = useMemo(() => {
    if (!hodRequests) return 0;
    if (isAdmin) {
      return hodRequests.filter(
        (r: { status: string }) =>
          r.status === 'HOD_APPROVED' || r.status === 'CEO_APPROVED',
      ).length;
    }
    if (isCEO) {
      return hodRequests.filter(
        (r: { status: string }) => r.status === 'CEO_REVIEW',
      ).length;
    }
    return hodRequests.filter(
      (r: { department: { id: string }; status: string }) =>
        r.department?.id === user?.department?.id && r.status === 'PENDING',
    ).length;
  }, [hodRequests, user, isAdmin, isCEO]);

  const filteredResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    if (assets) {
      (assets as SearchAsset[])
        .filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.serial_number.toLowerCase().includes(q) ||
            a.tag_id?.toLowerCase().includes(q),
        )
        .slice(0, 5)
        .forEach((a) => {
          results.push({
            id: a.id,
            name: a.name,
            type: 'asset',
            subtitle: `SN: ${a.serial_number}`,
            path: `/assets?search=${a.serial_number}`,
          });
        });
    }
    if (staff) {
      (staff as SearchUser[])
        .filter(
          (s) =>
            s.full_name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q),
        )
        .slice(0, 5)
        .forEach((s) => {
          results.push({
            id: s.id,
            name: s.full_name,
            type: 'user',
            subtitle: s.email,
            path: `/directorate`,
          });
        });
    }

    return results;
  }, [searchQuery, assets, staff]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowResults(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/assets?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const navItems = useMemo((): NavItem[] => {
    if (isAdmin || isCEO) {
      const baseItems: NavItem[] = [
        { name: 'System Overview', path: '/overview', icon: LayoutDashboard },
        { name: 'Procurement', path: '/requests', icon: ClipboardCheck },
        { name: 'Asset Masterlist', path: '/assets', icon: Laptop },
      ];

      if (isAdmin || isCEO) {
        baseItems.push({
          name: 'Incidents Report',
          path: '/incidents',
          icon: AlertTriangle,
        });
        baseItems.push({
          name: 'Organisational Unit',
          path: '/directorate',
          icon: Users,
        });
        if (isAdmin) {
          baseItems.push({
            name: 'Audit Trail',
            path: '/audit-trail',
            icon: History,
          });
        }
      }

      baseItems.push({ name: 'My Profile', path: '/profile', icon: UserIcon });

      return baseItems;
    } else {
      const items: NavItem[] = [
        {
          name: isHOD ? 'Department Overview' : 'Assets Overview',
          path: '/overview',
          icon: LayoutDashboard,
        },
        {
          name: isHOD ? 'Asset Requests' : 'My Requests',
          path: '/requests',
          icon: ClipboardCheck,
        },
      ];

      if (isHOD) {
        items.push({
          name: 'Incidents Report',
          path: '/incidents',
          icon: AlertTriangle,
        });
      } else {
        items.push({
          name: 'Request Asset',
          onClick: () => setIsRequestModalOpen(true),
          icon: Plus,
        });
        items.push({
          name: 'Report Incident',
          onClick: () => setIsIncidentModalOpen(true),
          icon: ShieldAlert,
        });
      }

      items.push({ name: 'My Profile', path: '/profile', icon: UserIcon });
      return items;
    }
  }, [isAdmin, isHOD, isCEO]);

  return (
    <div className="relative flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ff8000] rounded-full blur-[150px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#e49f37] rounded-full blur-[120px] opacity-[0.08] pointer-events-none" />

      <aside className="relative z-20 w-60 bg-white/60 backdrop-blur-2xl border-r border-white/80 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white p-1 rounded-full shadow-sm border border-slate-100">
              <img
                src="https://pbs.twimg.com/profile_images/1151137195027132418/5g7iNP8z_400x400.png"
                alt="HISP Rwanda"
                className="w-8 h-8 rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-slate-800 tracking-tight leading-none">
                HISP-AMS
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#ff8000] mt-0.5">
                Rwanda
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const commonClasses = (active: boolean) =>
              `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 group font-medium text-left ${
                active
                  ? 'bg-gradient-to-r from-[#ff8000] to-[#e49f37] text-white shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)]'
                  : 'text-slate-500 hover:bg-white/80 hover:text-[#ff8000] hover:shadow-sm'
              }`;

            if (item.onClick) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className={commonClasses(false)}
                >
                  <item.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs font-semibold">{item.name}</span>
                </button>
              );
            }

            const isAuditItem = item.name === 'Audit Trail';
            const auditPaths = [
              '/audit-trail',
              '/system-trail',
              '/incident-trail',
              '/procurement-trail',
              '/disposal-logs',
              '/assignment-history',
              '/request-trail',
              '/asset-trail',
            ];
            const isAuditActive =
              isAuditItem && auditPaths.includes(location.pathname);
            const isIncidentActive =
              item.name === 'Incidents Report' &&
              (location.pathname === '/incidents' ||
                location.pathname === '/penalties');

            return (
              <NavLink
                key={item.name}
                to={item.path!}
                className={({ isActive }) =>
                  commonClasses(isActive || isAuditActive || isIncidentActive)
                }
              >
                {({ isActive }) => {
                  const effectivelyActive =
                    isActive || isAuditActive || isIncidentActive;
                  return (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <item.icon
                          className={`w-4 h-4 transition-transform duration-300 ${
                            effectivelyActive
                              ? 'scale-110'
                              : 'group-hover:scale-110'
                          }`}
                        />
                        <span className="text-xs font-semibold">
                          {item.name}
                        </span>
                      </div>
                      {item.name === 'Incidents Report' &&
                        pendingIncidentsCount > 0 && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${effectivelyActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white shadow-sm'}`}
                          >
                            {pendingIncidentsCount}
                          </span>
                        )}
                      {(item.name === 'Asset Requests' ||
                        item.name === 'Procurement') &&
                        pendingRequestsCount > 0 && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${effectivelyActive ? 'bg-white text-orange-950' : 'bg-orange-950 text-white shadow-sm'}`}
                          >
                            {pendingRequestsCount}
                          </span>
                        )}
                    </div>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 m-3 bg-white/50 backdrop-blur-md rounded-xl border border-white shadow-sm">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff8000] to-[#e49f37] flex items-center justify-center font-bold text-white text-xs shadow-inner">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                {user?.full_name || 'Admin User'}
              </span>
              <span className="text-[9px] text-[#e49f37] uppercase font-semibold tracking-wider">
                {user?.role || 'SYSTEM ADMIN'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 bg-white/60 hover:bg-[#ff8000] hover:text-white rounded-lg transition-colors group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white/40 backdrop-blur-xl border-b border-white flex items-center justify-between px-6 sticky top-0 z-30">
          {isOverviewPage ? (
            <div className="relative w-full max-w-md group" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-orange-400/60 group-focus-within:text-[#ff8000] transition-colors" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search by serial number, user, or tag ID..."
                  className="w-full bg-white/60 border border-white rounded-2xl pl-11 pr-12 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000]/30 outline-none transition-all placeholder:text-slate-400 font-medium shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">
                      ⌘K
                    </span>
                  )}
                </div>
              </form>

              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-white rounded-3xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Quick Results
                    </span>
                    {searchQuery.length > 0 && (
                      <span className="text-[10px] font-bold text-[#ff8000]">
                        {filteredResults.length} matches
                      </span>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto py-2">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => {
                            navigate(result.path);
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-orange-50/50 transition-all text-left group"
                        >
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                              result.type === 'asset'
                                ? 'bg-slate-50 border border-slate-100'
                                : 'bg-orange-50 border border-orange-100'
                            }`}
                          >
                            {result.type === 'asset' ? (
                              <Laptop className="w-5 h-5 text-slate-500" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {result.name}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-orange-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <History className="w-6 h-6 text-orange-200" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                          No results found for "{searchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">
                          Try searching by serial number or name.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-4 px-6 bg-[#ff8000] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#e49f37] transition-colors flex items-center justify-center gap-2"
                  >
                    View All Search Results <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center">
              <h1 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                {headerTitle}
              </h1>
            </div>
          )}

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-5 lg:p-6">
          <Outlet
            context={{
              openRequest: () => setIsRequestModalOpen(true),
              openIncident: () => setIsIncidentModalOpen(true),
              setHeaderTitle,
            }}
          />
        </main>
      </div>

      <SimpleRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
      <ReportAssetIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
      />
    </div>
  );
};
