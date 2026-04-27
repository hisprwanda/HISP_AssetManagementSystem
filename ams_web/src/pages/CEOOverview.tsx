import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  ArrowRight,
  Monitor,
  Target,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  Activity,
  FileText,
  Building2,
  PieChart,
  Users,
  Clock,
  History as AuditIcon,
  ShoppingCart,
  Smartphone,
  Printer,
  Box,
  Eye,
  FileCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {
  Asset,
  AssetRequest,
  User,
  AssetIncident,
  AssetAssignment,
} from '../types/assets';
import { ViewAssetModal } from '../components/ViewAssetModal';
import { AssetReceiptFormModal } from '../components/AssetReceiptFormModal';
import { Pagination } from '../components/Pagination';

interface Department {
  id: string;
  name: string;
  status?: string;
  users?: User[];
}

export const CEOOverview = () => {
  const navigate = useNavigate();
  const { user: currentUser, isCEO } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [signingAssignment, setSigningAssignment] =
    useState<AssetAssignment | null>(null);
  const [personalPage, setPersonalPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [feedPage, setFeedPage] = useState(1);
  const itemsPerPage = 10;

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

  const { data: incidents } = useQuery<AssetIncident[]>({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
    enabled: isCEO,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: isCEO,
  });

  const { data: allDepartments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
    enabled: isCEO,
  });

  const stats = useMemo(() => {
    if (!assets || !requests || !currentUser) return null;

    const personalAssets = assets.filter(
      (a) => a.assigned_to?.id === currentUser?.id,
    );

    const totalValue = assets.reduce(
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
    const liveAssets = assets.filter((a) => a.status !== 'DISPOSED');

    const ceoPending = requests.filter((r) => r.status === 'CEO_REVIEW');
    const ceoPendingValue = ceoPending.reduce((sum, r: AssetRequest) => {
      const val =
        r.financials?.grand_total ??
        (r.quantity || 0) * (r.estimated_unit_cost || 0);
      return sum + val;
    }, 0);

    const departments: Record<string, { count: number; value: number }> = {};
    liveAssets.forEach((a) => {
      const deptName = a.department?.name || 'Unassigned';
      if (!departments[deptName])
        departments[deptName] = { count: 0, value: 0 };
      departments[deptName].count++;
      departments[deptName].value += Number(a.current_value) || 0;
    });

    const topDepartments = Object.entries(departments)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5);

    const categories: Record<string, { count: number; value: number }> = {};
    liveAssets.forEach((a) => {
      const catName = a.category?.name || 'Uncategorized';
      if (!categories[catName]) categories[catName] = { count: 0, value: 0 };
      categories[catName].count++;
      categories[catName].value += Number(a.current_value) || 0;
    });

    return {
      totalValue,
      inventoryCount: liveAssets.length,
      ceoPendingCount: ceoPending.length,
      ceoPendingValue,
      missingAssets,
      brokenAssets,
      totalUsers: users?.length || 0,
      totalDepreciation,
      topDepartments,
      activeDeptCount:
        allDepartments?.filter(
          (d) => d.status === 'Active' || (d.users && d.users.length > 0),
        ).length || 0,
      categories: Object.entries(categories).sort(
        (a, b) => b[1].value - a[1].value,
      ),
      personalAssets,
      ceoRequests: ceoPending.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      ),
      activityFeed: [
        ...(requests || []).map((r) => ({
          id: r.id,
          type: 'REQUEST',
          label: 'Procurement',
          title: r.title,
          date: r.created_at,
          status: r.status,
          user: r.requested_by?.full_name,
        })),
        ...(incidents || []).map((i) => ({
          id: i.id,
          type: 'INCIDENT',
          label: 'Security',
          title: `${i.incident_type}: ${i.asset?.name}`,
          date: i.reported_at,
          status: i.investigation_status,
          user: i.reported_by?.full_name,
        })),
      ].sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
      ),
    };
  }, [assets, requests, users, incidents, currentUser, allDepartments]);

  const paginatedPersonalAssets = useMemo(() => {
    if (!stats) return [];
    const start = (personalPage - 1) * itemsPerPage;
    return stats.personalAssets.slice(start, start + itemsPerPage);
  }, [stats, personalPage, itemsPerPage]);

  const paginatedRequests = useMemo(() => {
    if (!stats) return [];
    const start = (requestsPage - 1) * itemsPerPage;
    return stats.ceoRequests.slice(start, start + itemsPerPage);
  }, [stats, requestsPage, itemsPerPage]);

  const paginatedFeed = useMemo(() => {
    if (!stats) return [];
    const start = (feedPage - 1) * itemsPerPage;
    return stats.activityFeed.slice(start, start + itemsPerPage);
  }, [stats, feedPage, itemsPerPage]);

  const personalTotalPages = Math.ceil(
    (stats?.personalAssets.length || 0) / itemsPerPage,
  );
  const requestsTotalPages = Math.ceil(
    (stats?.ceoRequests.length || 0) / itemsPerPage,
  );
  const feedTotalPages = Math.ceil(
    (stats?.activityFeed.length || 0) / itemsPerPage,
  );

  const getAssetIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('laptop') || n.includes('computer'))
      return <Monitor className="w-8 h-8" />;
    if (n.includes('phone')) return <Smartphone className="w-8 h-8" />;
    if (n.includes('printer')) return <Printer className="w-8 h-8" />;
    return <Box className="w-8 h-8" />;
  };

  const getStatusStyle = (asset: Asset) => {
    if (
      asset.status === 'IN_STOCK' &&
      asset.assignment_history?.some(
        (a) => a.form_status === 'PENDING_USER_SIGNATURE',
      )
    ) {
      return 'bg-orange-600 text-white border-orange-500 font-semibold shadow-md';
    }
    switch (asset.status) {
      case 'IN_STOCK':
        return 'bg-orange-50 text-orange-950 border-orange-200 font-semibold';
      case 'ASSIGNED':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      case 'BROKEN':
      case 'MISSING':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 bg-orange-50 rounded-md border border-orange-100 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#ff8000] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-orange-400" /> Executive
              Strategic Dashboard
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">
            Asset Intelligence Portal
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-sm max-w-xl leading-relaxed">
            Corporate oversight, procurement authorization, and
            organization-wide resource stewardship for HISP-Rwanda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Asset Value',
            value: (stats.totalValue || 0).toLocaleString(),
            unit: 'RWF',
            icon: Banknote,
            color: 'orange',
            trend: 'Direct Valuation',
            path: '/assets',
          },
          {
            label: 'Executive Approvals',
            value: stats.ceoPendingCount,
            unit: 'AWAITING',
            icon: Target,
            color: 'amber',
            trend: `${(stats.ceoPendingValue || 0).toLocaleString()} Exposure`,
            path: '/requests',
          },
          {
            label: 'Asset Roster',
            value: stats.inventoryCount,
            unit: 'UNITS',
            icon: Monitor,
            color: 'slate',
            trend: 'Resource Deployment',
            path: '/assets',
          },
          {
            label: 'Directorates',
            value: stats.activeDeptCount,
            unit: 'ACTIVE',
            icon: Building2,
            color: 'slate',
            trend: `${stats.totalUsers} Workforce Node`,
            path: '/directorate',
          },
        ].map((stat, i) => (
          <Link
            key={i}
            to={stat.path}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm group hover:border-[#ff8000] hover:shadow-md transition-colors block relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-[#ff8000] group-hover:border-[#ff8000] transition-colors">
                <stat.icon className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-[#ff8000] transition-all" />
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5 leading-none">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1.5 leading-none">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight group-hover:text-[#ff8000] transition-colors">
                {stat.value}
              </h3>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {stat.unit}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-[#ff8000] rounded-full shadow-[0_0_10px_rgba(255,128,0,0.3)]" />
              Your Personally Assigned Equipment
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#ff8000] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              {stats.personalAssets.length} Executive Items
            </span>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-h-[250px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-orange-100/30 bg-orange-50/20">
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Asset Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Tag / Serial
                    </th>
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">
                      Status & Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedPersonalAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff8000]">
                            {getAssetIcon(asset.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 tracking-tight">
                              {asset.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {asset.category?.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <code className="text-xs font-bold text-slate-600 tracking-tighter">
                            {asset.tag_id || 'NON-TAGGED'}
                          </code>
                          <span className="text-[9px] font-medium text-slate-400">
                            {asset.serial_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest border ${getStatusStyle(asset)}`}
                        >
                          {asset.status === 'IN_STOCK' &&
                          asset.assignment_history?.some(
                            (a) => a.form_status === 'PENDING_USER_SIGNATURE',
                          )
                            ? 'Signature Required'
                            : asset.status.replace('_', ' ')}
                        </span>
                        {asset.status === 'IN_STOCK' &&
                          asset.assignment_history?.some(
                            (a) => a.form_status === 'PENDING_USER_SIGNATURE',
                          ) && (
                            <button
                              onClick={() => {
                                const pending = asset.assignment_history?.find(
                                  (a) =>
                                    a.form_status === 'PENDING_USER_SIGNATURE',
                                );
                                if (pending)
                                  setSigningAssignment({
                                    ...pending,
                                    asset,
                                  } as unknown as AssetAssignment);
                              }}
                              className="px-3 py-1.5 bg-[#ff8000] text-white hover:bg-orange-600 rounded-lg text-[10px] font-semibold uppercase tracking-widest shadow-md transition-colors flex items-center gap-2"
                            >
                              <FileCheck className="w-3.5 h-3.5" /> Sign Form
                            </button>
                          )}
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stats.personalAssets.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center opacity-40">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                          No personal equipment assigned to executive office
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={personalPage}
              totalPages={personalTotalPages}
              onPageChange={setPersonalPage}
              itemsPerPage={itemsPerPage}
              totalItems={stats.personalAssets.length}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {stats.ceoPendingCount > 0 && (
              <div className="bg-gradient-to-r from-[#ff8000] to-orange-600 rounded-3xl p-8 relative overflow-hidden group shadow-xl shadow-orange-100">
                <div className="absolute top-0 right-0 w-80 h-full bg-white/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0 leading-none">
                      <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white uppercase tracking-[0.1em]">
                        Executive Authorization Pending
                      </h3>
                      <p className="text-white/80 text-xs font-medium leading-relaxed mt-2 max-w-md">
                        There are {stats.ceoPendingCount} verified procurement
                        requisitions totaling{' '}
                        <span className="text-white font-semibold">
                          {stats.ceoPendingValue.toLocaleString()} RWF
                        </span>{' '}
                        that require your immediate approval for organizational
                        alignment.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/requests"
                    className="px-8 py-4 bg-white text-[#ff8000] rounded-2xl text-[11px] font-semibold uppercase tracking-widest transition-all active:scale-95 shadow-2xl whitespace-nowrap"
                  >
                    Review Queue
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <Activity className="w-6 h-6 text-orange-500" /> Executive
                    Decision Queue
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] opacity-60">
                    Critical Path Requisitions
                  </p>
                </div>
                <Link
                  to="/requests"
                  className="text-[10px] font-semibold uppercase tracking-widest text-[#ff8000] hover:text-orange-600 flex items-center gap-2"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4 min-h-[300px]">
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => navigate('/requests')}
                      className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:border-orange-200 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff8000] transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 text-[#ff8000] transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-slate-800 group-hover:text-[#ff8000] transition-colors truncate mb-1">
                            {req.title}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                              <Building2 className="w-3.5 h-3.5" />{' '}
                              {req.department?.name}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <p className="text-[11px] font-bold text-slate-500">
                              By{' '}
                              <span className="text-slate-900 font-semibold">
                                {req.requested_by?.full_name}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0">
                        <p className="text-xl font-semibold text-slate-900 tracking-tight">
                          {(req.financials?.grand_total || 0).toLocaleString()}{' '}
                          <span className="text-sm text-slate-400">RWF</span>
                        </p>
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-semibold uppercase tracking-widest rounded-lg border border-orange-100">
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                    <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-40" />
                    <p className="text-sm text-slate-400 font-semibold uppercase tracking-widest">
                      Decision queue empty
                    </p>
                  </div>
                )}
              </div>
              <Pagination
                currentPage={requestsPage}
                totalPages={requestsTotalPages}
                onPageChange={setRequestsPage}
                itemsPerPage={itemsPerPage}
                totalItems={stats.ceoRequests.length}
              />
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <AuditIcon className="w-6 h-6 text-orange-400" /> Unified
                    Activity Stream
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] opacity-60">
                    Real-time Governance Monitoring
                  </p>
                </div>
              </div>
              <div className="space-y-6 min-h-[400px]">
                {paginatedFeed.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-6 group cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-slate-50 transition-all"
                    onClick={() =>
                      navigate(
                        item.type === 'REQUEST' ? '/requests' : '/incidents',
                      )
                    }
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${item.type === 'REQUEST' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-500'} flex items-center justify-center shrink-0 border border-transparent group-hover:border-current transition-all shadow-sm`}
                    >
                      {item.type === 'REQUEST' ? (
                        <ShoppingCart className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                          {item.title}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-widest ${item.type === 'REQUEST' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <span className="text-slate-600 font-semibold">
                          {item.user}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>
                          {new Date(item.date || 0).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-slate-400 font-semibold">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={feedPage}
                totalPages={feedTotalPages}
                onPageChange={setFeedPage}
                itemsPerPage={itemsPerPage}
                totalItems={stats.activityFeed.length}
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> Strategic
                Workforce
              </h3>
              <div className="space-y-5">
                {users?.slice(0, 6).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => navigate('/directorate')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[10px] font-semibold text-[#ff8000] border border-orange-100 uppercase group-hover:bg-[#ff8000] group-hover:text-white transition-all">
                        {user.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">
                          {user.full_name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#ff8000] transition-colors shadow-[0_0_8px_rgba(255,128,0,0.3)]" />
                  </div>
                ))}
              </div>
              <Link
                to="/directorate"
                className="mt-8 block w-full py-4 bg-slate-50 hover:bg-[#ff8000] hover:text-white rounded-2xl text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all border border-slate-100 group shadow-inner"
              >
                Corporate Roster{' '}
                <ArrowRight className="w-3.5 h-3.5 inline ml-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-orange-400" /> Capital
                Allocation
              </h3>
              <div className="space-y-8">
                {stats.categories.slice(0, 6).map(([name, data]) => (
                  <div key={name} className="group/item">
                    <div className="flex justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3 group-hover/item:text-orange-600 transition-colors">
                      <span>{name}</span>
                      <span>
                        {((data.value / (stats.totalValue || 1)) * 100).toFixed(
                          0,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="h-full bg-orange-400 group-hover/item:bg-[#ff8000] transition-all shadow-sm"
                        style={{
                          width: `${(data.value / (stats.totalValue || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                      <span>{data.count} Assets</span>
                      <span>{data.value.toLocaleString()} RWF</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Cumulative Depreciation
                </p>
                <h4 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center justify-center gap-3">
                  <TrendingDown className="w-6 h-6 text-slate-600" />{' '}
                  {stats.totalDepreciation.toLocaleString()}{' '}
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    RWF
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div>

        <ViewAssetModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          asset={selectedAsset}
        />

        <AssetReceiptFormModal
          isOpen={!!signingAssignment}
          onClose={() => setSigningAssignment(null)}
          assignment={signingAssignment}
        />
      </div>
    </div>
  );
};
