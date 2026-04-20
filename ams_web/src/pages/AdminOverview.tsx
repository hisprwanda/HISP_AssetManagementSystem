import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  ArrowRight,
  Monitor,
  Target,
  Users,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  Activity,
  Clock,
  FileText,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Asset, AssetRequest, User } from '../types/assets';

export const AdminOverview = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const { data: requests } = useQuery<AssetRequest[]>({
    queryKey: ['assets-requests'],
    queryFn: async () => {
      const response = await api.get('/assets-requests');
      return response.data;
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: isAdmin,
  });

  const stats = useMemo(() => {
    if (!assets || !requests) return null;

    const activeAssets = assets.filter((a) => a.status !== 'DISPOSED');

    const totalValue = activeAssets.reduce(
      (sum, a) => sum + (Number(a.current_value) || 0),
      0,
    );
    const purchaseCost = assets.reduce(
      (sum, a) => sum + (Number(a.purchase_cost) || 0),
      0,
    );
    const totalDepreciation = purchaseCost - totalValue;

    const missingAssets = assets.filter((a) => a.status === 'MISSING').length;
    const brokenAssets = assets.filter((a) => a.status === 'BROKEN').length;

    const pendingRequests = requests.filter(
      (r) => r.status === 'HOD_APPROVED' || r.status === 'APPROVED',
    );
    const pendingRequestsValue = pendingRequests.reduce(
      (sum, r: AssetRequest) => {
        const val =
          r.financials?.grand_total ??
          (r.quantity || 0) * (r.estimated_unit_cost || 0);
        return sum + val;
      },
      0,
    );

    const categories: Record<string, { count: number; value: number }> = {};
    activeAssets.forEach((a) => {
      const catName = a.category?.name || 'Uncategorized';
      if (!categories[catName]) categories[catName] = { count: 0, value: 0 };
      categories[catName].count++;
      categories[catName].value += Number(a.current_value) || 0;
    });

    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5);

    return {
      totalValue,
      inventoryCount: activeAssets.length,
      pendingRequestsCount: pendingRequests.length,
      pendingRequestsValue,
      missingAssets,
      brokenAssets,
      totalUsers: users?.length || 0,
      totalDepreciation,
      topCategories,
      pendingFormsCount: assets.filter((a) =>
        a.assignment_history?.some(
          (h) => h.form_status === 'PENDING_ADMIN_REVIEW',
        ),
      ).length,
      recentRequests: [...requests]
        .filter((r) => r.status !== 'PENDING')
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 5),
    };
  }, [assets, requests, users]);

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="px-2 py-0.5 bg-orange-50 rounded-md border border-orange-100 text-[8px] font-black uppercase tracking-widest text-[#ff8000] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-[#ff8000]" /> Administrative
              Session Secure
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            System Intelligence
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-sm max-w-xl leading-relaxed">
            Organization-wide asset lifecycle monitoring and procurement
            pipeline management for HISP-Rwanda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Global Valuation',
            value: (stats.totalValue || 0).toLocaleString(),
            unit: 'RWF',
            icon: Banknote,
            color: 'orange',
            trend: 'Active Inventory',
            path: '/assets',
          },
          {
            label: 'Administrative Roster',
            value: stats.inventoryCount,
            unit: 'UNITS',
            icon: Monitor,
            color: 'slate',
            trend: `${(stats.missingAssets || 0) + (stats.brokenAssets || 0)} Incidents Detected`,
            path: '/assets',
          },
          {
            label: 'Financial Pipeline',
            value: stats.pendingRequestsCount,
            unit: 'OPEN',
            icon: Target,
            color: 'slate',
            trend: `${(stats.pendingRequestsValue || 0).toLocaleString()} Exposure`,
            path: '/requests',
          },
          {
            label: 'Human Capital',
            value: stats.totalUsers,
            unit: 'PEOPLE',
            icon: Users,
            color: 'slate',
            trend: 'Access Stable',
            path: '/directorate',
          },
        ].map((stat, i) => (
          <Link
            key={i}
            to={stat.path}
            className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm group hover:border-[#ff8000] hover:shadow-md transition-all block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 group-hover:bg-[#ff8000] group-hover:border-[#ff8000] transition-colors">
                <stat.icon className="w-3.5 h-3.5 text-[#ff8000] group-hover:text-white transition-colors" />
              </div>
              <ArrowRight className="w-3 h-3 text-slate-200 group-hover:text-[#ff8000] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1 leading-none">
              <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-[#ff8000] transition-colors">
                {stat.value}
              </h3>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">
                {stat.unit}
              </span>
            </div>
            <p
              className={`mt-2 text-[8px] font-bold uppercase tracking-widest ${stat.color === 'slate' && stats.missingAssets + stats.brokenAssets > 0 && i === 0 ? 'text-[#ff8000]' : 'text-slate-400'}`}
            >
              {stat.trend}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {((stats.pendingRequestsCount || 0) > 0 ||
            (stats.brokenAssets || 0) > 0) && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-full bg-[#ff8000]/5 blur-[60px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-orange-200 shadow-sm shrink-0">
                    <ShieldAlert className="w-5 h-5 text-[#ff8000]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em]">
                      Immediate Action Required
                    </h3>
                    <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
                      {stats.pendingRequestsCount} Pending Requisitions,{' '}
                      {stats.pendingFormsCount} Forms Awaiting Approval, and{' '}
                      {stats.missingAssets + stats.brokenAssets} Security
                      Incidents are awaiting your review.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    to="/assets"
                    className="px-4 py-2 bg-[#ff8000] hover:bg-[#e49f37] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-100"
                  >
                    Finish Handover
                  </Link>
                  <Link
                    to="/requests"
                    className="px-4 py-2 bg-white border border-orange-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all"
                  >
                    Resolve Requisitions
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-orange-400" /> Transaction
                  Pipeline
                </h3>
                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest opacity-60">
                  Status of Acquisitions
                </p>
              </div>
              <Link
                to="/requests"
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-[#ff8000] hover:text-[#ff8000] transition-all flex items-center gap-2"
              >
                Audit Log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {stats.recentRequests.length > 0 ? (
                stats.recentRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => navigate('/requests')}
                    className="p-5 bg-slate-50/40 border border-slate-100 rounded-xl hover:bg-white hover:border-orange-100 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 hover:border-b-[#ff8000] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          req.status === 'PENDING'
                            ? 'sm:bg-orange-50 sm:text-[#ff8000] sm:border-orange-100'
                            : req.status === 'APPROVED'
                              ? 'sm:bg-slate-50 sm:text-slate-500 sm:border-slate-100'
                              : req.status === 'FULFILLED'
                                ? 'sm:bg-orange-100 sm:text-orange-950 sm:border-orange-200 font-bold'
                                : 'sm:bg-slate-50 sm:text-slate-400 sm:border-slate-100'
                        } bg-white shadow-sm`}
                      >
                        {req.status === 'PENDING' ? (
                          <Clock className="w-5 h-5" />
                        ) : req.status === 'FULFILLED' ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 group-hover:text-[#ff8000] transition-colors truncate mb-1">
                          {req.title}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[8px] font-black uppercase text-slate-400 tracking-widest">
                            {req.id.slice(0, 8)}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                            By{' '}
                            <span className="text-slate-700 font-bold">
                              {req.requested_by?.full_name}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pr-1">
                      <p className="text-base font-black text-slate-900 tracking-tight">
                        {(
                          req.financials?.grand_total ||
                          (req.estimated_unit_cost || 0) * (req.quantity || 0)
                        ).toLocaleString()}{' '}
                        <span className="text-[9px] text-slate-400">RWF</span>
                      </p>
                      <div
                        className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                          req.status === 'PENDING'
                            ? 'bg-white text-orange-400 border-orange-100'
                            : req.status === 'APPROVED' ||
                                req.status === 'HOD_APPROVED'
                              ? 'bg-white text-slate-500 border-slate-100'
                              : req.status === 'FULFILLED'
                                ? 'bg-white text-slate-800 border-slate-200'
                                : 'bg-white text-orange-600 border-orange-100'
                        }`}
                      >
                        {req.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                  <Activity className="w-10 h-10 text-slate-200 mx-auto mb-4 opacity-40" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    No active transactions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:border-[#ff8000] transition-all">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#ff8000]/5 rounded-full blur-[40px] translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-orange-200 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-[#ff8000]" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-slate-900">
                Strategic Expansion
              </h4>
              <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-6 px-4">
                Assign new organizational assets directly into the localized
                inventory system.
              </p>
              <button
                onClick={() =>
                  navigate('/assets', { state: { openModal: true } })
                }
                className="w-full py-3 bg-[#ff8000] hover:bg-[#e49f37] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100"
              >
                Assign Asset
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">
              Financial Health
            </h3>
            <div className="space-y-6">
              {stats.topCategories.map(([name, data]) => (
                <div key={name} className="group/item">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover/item:text-slate-900 transition-colors">
                    <span>{name}</span>
                    <span>
                      {((data.value / (stats.totalValue || 1)) * 100).toFixed(
                        0,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-300 group-hover/item:from-[#ff8000] group-hover/item:to-[#e49f37] transition-all duration-700"
                      style={{
                        width: `${(data.value / (stats.totalValue || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-400 uppercase tracking-[0.05em] leading-none">
                    <span>{data.count} Units</span>
                    <span>{data.value.toLocaleString()} RWF</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#ff8000] mb-1 leading-none">
                Resource Erosion
              </p>
              <h4 className="text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />{' '}
                {stats.totalDepreciation.toLocaleString()}{' '}
                <span className="text-[9px] text-slate-400">RWF</span>
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
