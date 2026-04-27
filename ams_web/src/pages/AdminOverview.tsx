import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Box,
  Eye,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {
  Asset,
  AssetRequest,
  User,
  AssetIncident as AssetIncidentType,
} from '../types/assets';
import { Pagination } from '../components/Pagination';
import { toast } from 'react-hot-toast';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { DamageReportModal } from '../components/DamageReportModal';
import { ViewAssetModal } from '../components/ViewAssetModal';
import { AssetReceiptFormModal } from '../components/AssetReceiptFormModal';
import { AssetAssignment as AssetAssignmentType } from '../types/assets';

export const AdminOverview = () => {
  const navigate = useNavigate();
  const { isAdmin, user: currentUser } = useAuth();
  const [requestsPage, setRequestsPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [finalizeAsset, setFinalizeAsset] = useState<Asset | null>(null);
  const [damageAsset, setDamageAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [signingAssignment, setSigningAssignment] =
    useState<AssetAssignmentType | null>(null);
  const [incidentToSettle, setIncidentToSettle] =
    useState<AssetIncidentType | null>(null);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();
  const penaltyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/asset-incidents/${id}/resolve-penalty`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
      toast.success('Penalty settled successfully.');
      setIncidentToSettle(null);
    },
  });

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

  const { data: incidents } = useQuery<AssetIncidentType[]>({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
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
        ),
      pendingReturns: assets.filter((a) => a.status === 'RETURN_PENDING'),
      userAssets: assets.filter((a) => {
        const isAssigned = a.assigned_to?.id === currentUser?.id;
        const hasActivePenalty = incidents?.some(
          (i) =>
            i.asset?.id === a.id &&
            i.reported_by?.id === currentUser?.id &&
            i.status === 'REJECTED_LIABILITY' &&
            !i.penalty_resolved_at,
        );
        return isAssigned || hasActivePenalty;
      }),
      personalPenalties: incidents?.filter(
        (i) =>
          i.reported_by?.id === currentUser?.id &&
          i.status === 'REJECTED_LIABILITY' &&
          !i.penalty_resolved_at,
      ),
    };
  }, [assets, requests, users, currentUser, incidents]);

  const paginatedRequests = useMemo(() => {
    if (!stats) return [];
    const start = (requestsPage - 1) * itemsPerPage;
    return stats.recentRequests.slice(start, start + itemsPerPage);
  }, [stats, requestsPage, itemsPerPage]);

  const requestsTotalPages = Math.ceil(
    (stats?.recentRequests.length || 0) / itemsPerPage,
  );

  const paginatedUserAssets = useMemo(() => {
    if (!stats) return [];
    const start = (inventoryPage - 1) * itemsPerPage;
    return stats.userAssets.slice(start, start + itemsPerPage);
  }, [stats, inventoryPage, itemsPerPage]);

  const inventoryTotalPages = Math.ceil(
    (stats?.userAssets.length || 0) / itemsPerPage,
  );

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="px-2 py-0.5 bg-orange-50 rounded-md border border-orange-100 text-[8px] font-semibold uppercase tracking-widest text-[#ff8000] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-[#ff8000]" /> Administrative
              Session Secure
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">
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
            <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5 leading-none">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1 leading-none">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight group-hover:text-[#ff8000] transition-colors">
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
        <div className="lg:col-span-9 space-y-6">
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
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.1em]">
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
                    className="px-4 py-2 bg-[#ff8000] hover:bg-[#e49f37] text-white rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all shadow-md shadow-orange-100"
                  >
                    Finish Handover
                  </Link>
                  <Link
                    to="/requests"
                    className="px-4 py-2 bg-white border border-orange-200 text-slate-600 rounded-lg text-[9px] font-semibold uppercase tracking-widest hover:bg-orange-50 transition-all"
                  >
                    Resolve Requisitions
                  </Link>
                </div>
              </div>
            </div>
          )}

          {stats.personalPenalties && stats.personalPenalties.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 relative overflow-hidden group animate-in slide-in-from-top-4 duration-500 mb-6">
              <div className="absolute top-0 right-0 w-32 h-full bg-red-500/5 blur-[60px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-red-200 shadow-sm shrink-0">
                    <Banknote className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 uppercase tracking-[0.1em]">
                      Pending Liability Penalty
                    </h3>
                    <p className="text-red-500 text-[10px] font-medium leading-relaxed">
                      You have {stats.personalPenalties.length} unresolved
                      liability penalty(ies) following a recent incident
                      investigation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setIncidentToSettle(stats.personalPenalties![0])
                    }
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-md shadow-red-100 flex items-center gap-2"
                  >
                    <Banknote className="w-3.5 h-3.5" /> Settle Penalty
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats.pendingReturns.length > 0 && (
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
                    <RotateCcw className="w-5 h-5 text-[#ff8000]" /> Inbound
                    Return Queue
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest opacity-60">
                    Assets awaiting inspection & receipt
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.pendingReturns.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-5 bg-white border border-slate-100 rounded-2xl space-y-5 shadow-sm hover:shadow-md transition-all group/card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff8000] shadow-sm transform group-hover/card:scale-110 transition-transform">
                          <Monitor className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 tracking-tight">
                            {asset.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {asset.tag_id || asset.serial_number}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em] mb-1">
                          Return By
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 border border-slate-200">
                            {asset.assigned_to?.full_name?.charAt(0) || 'U'}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-700">
                            {asset.assigned_to?.full_name || 'Assigned User'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={async () => {
                          setIsProcessing(asset.id);
                          try {
                            await api.patch(
                              `/assets/${asset.id}/acknowledge-return`,
                            );
                            toast.success(
                              'Return acknowledged. Instruction sent to user.',
                            );
                          } catch (error: unknown) {
                            const message =
                              error instanceof Error
                                ? (
                                    error as {
                                      response?: {
                                        data?: { message?: string };
                                      };
                                    }
                                  ).response?.data?.message || error.message
                                : 'Failed to acknowledge.';
                            toast.error(message);
                          } finally {
                            setIsProcessing(null);
                          }
                        }}
                        disabled={!!isProcessing}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[9px] font-medium uppercase tracking-widest hover:border-orange-200 hover:text-[#ff8000] hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" /> Acknowledge
                      </button>
                      <button
                        onClick={() => setFinalizeAsset(asset)}
                        disabled={!!isProcessing}
                        className="flex-[1.2] py-3 bg-[#ff8000] text-white rounded-xl text-[9px] font-medium uppercase tracking-[0.15em] hover:bg-[#e49f37] transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-1.5 disabled:opacity-50 transform active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => setDamageAsset(asset)}
                        disabled={!!isProcessing}
                        className="flex-1 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[9px] font-medium uppercase tracking-widest hover:bg-rose-100 hover:border-rose-200 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Damage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ConfirmActionModal
            isOpen={!!finalizeAsset}
            onClose={() => setFinalizeAsset(null)}
            onConfirm={async () => {
              if (!finalizeAsset) return;
              setIsProcessing(finalizeAsset.id);
              try {
                await api.patch(`/assets/${finalizeAsset.id}/finalize-return`, {
                  isDamaged: false,
                });
                toast.success('Asset returned to stock in good condition.');
              } catch (error: unknown) {
                const message =
                  error instanceof Error
                    ? (
                        error as {
                          response?: { data?: { message?: string } };
                        }
                      ).response?.data?.message || error.message
                    : 'Failed to finalize.';
                toast.error(message);
              } finally {
                setIsProcessing(null);
              }
            }}
            title="Finalize Asset Return"
            message={`Finalize return of **${finalizeAsset?.name}** in **GOOD** condition? Asset will be moved to stock.`}
            confirmText="Finalize Return"
            variant="success"
            isLoading={!!isProcessing}
          />

          <DamageReportModal
            isOpen={!!damageAsset}
            onClose={() => setDamageAsset(null)}
            assetName={damageAsset?.name || ''}
            isLoading={!!isProcessing}
            onConfirm={async (remarks) => {
              if (!damageAsset) return;
              setIsProcessing(damageAsset.id);
              try {
                await api.patch(`/assets/${damageAsset.id}/finalize-return`, {
                  isDamaged: true,
                  remarks: remarks,
                });
                toast.success(
                  'Asset marked as DAMAGED. Incident report generated.',
                );
                setDamageAsset(null);
              } catch (error: unknown) {
                const message =
                  error instanceof Error
                    ? (
                        error as {
                          response?: { data?: { message?: string } };
                        }
                      ).response?.data?.message || error.message
                    : 'Failed to report damage.';
                toast.error(message);
              } finally {
                setIsProcessing(null);
              }
            }}
          />

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-8">
            <div className="p-4 border-b border-slate-100/50 flex items-center justify-between bg-white/40 mb-6">
              <h3 className="text-[11px] font-semibold text-slate-900 tracking-tight flex items-center gap-3 uppercase tracking-widest">
                <div className="w-1.5 h-4 bg-[#ff8000] rounded-full shadow-[0_0_12px_rgba(255,128,0,0.3)]" />
                My Asset Inventory
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100/50 bg-slate-50/50">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Asset
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Category
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Assignment Date
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {stats.userAssets.length > 0 ? (
                    paginatedUserAssets.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                              <Box className="w-4 h-4 text-slate-400 group-hover:text-[#ff8000]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 tracking-tight leading-none mb-1 group-hover:text-[#ff8000] transition-colors">
                                {asset.name}
                              </p>
                              <code className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 transition-colors">
                                {asset.tag_id || 'NON-TAGGED'}
                              </code>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-200/50">
                            {asset.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-widest border border-transparent shadow-sm ${
                              asset.status === 'IN_STOCK' &&
                              asset.assignment_history?.some(
                                (a) =>
                                  a.form_status === 'PENDING_USER_SIGNATURE',
                              )
                                ? 'bg-orange-600 text-white border-orange-500 animate-pulse'
                                : stats.personalPenalties?.some(
                                      (p) => p.asset?.id === asset.id,
                                    )
                                  ? 'bg-red-50 text-red-600 border-red-200 font-bold'
                                  : asset.status === 'BROKEN'
                                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                                    : asset.status === 'MISSING'
                                      ? 'bg-orange-50 text-orange-600 border-orange-100 italic'
                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                asset.status === 'IN_STOCK' &&
                                asset.assignment_history?.some(
                                  (a) =>
                                    a.form_status === 'PENDING_USER_SIGNATURE',
                                )
                                  ? 'bg-white'
                                  : asset.status === 'BROKEN'
                                    ? 'bg-orange-500'
                                    : asset.status === 'MISSING'
                                      ? 'bg-orange-400'
                                      : 'bg-slate-300'
                              }`}
                            />
                            {asset.status === 'IN_STOCK' &&
                            asset.assignment_history?.some(
                              (a) => a.form_status === 'PENDING_USER_SIGNATURE',
                            )
                              ? 'Signature Required'
                              : stats.personalPenalties?.some(
                                    (p) => p.asset?.id === asset.id,
                                  )
                                ? 'Liability Penalty'
                                : asset.status === 'ASSIGNED'
                                  ? 'Assigned'
                                  : asset.status === 'BROKEN'
                                    ? 'Broken'
                                    : asset.status === 'MISSING'
                                      ? 'Missing'
                                      : asset.status.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon className="w-3.5 h-3.5 opacity-40 text-slate-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                              {asset.purchase_date
                                ? new Date(
                                    asset.purchase_date,
                                  ).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'MAR 2024'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          {asset.status === 'IN_STOCK' &&
                            asset.assignment_history?.some(
                              (a) => a.form_status === 'PENDING_USER_SIGNATURE',
                            ) && (
                              <button
                                onClick={() => {
                                  const pending =
                                    asset.assignment_history?.find(
                                      (a) =>
                                        a.form_status ===
                                        'PENDING_USER_SIGNATURE',
                                    );
                                  if (pending)
                                    setSigningAssignment({
                                      ...pending,
                                      asset,
                                    } as unknown as AssetAssignmentType);
                                }}
                                className="px-3 py-1.5 bg-[#ff8000] text-white hover:bg-orange-600 rounded-lg text-[10px] font-semibold uppercase tracking-widest shadow-md transition-colors"
                                title="Sign Receipt Form"
                              >
                                Sign Form
                              </button>
                            )}
                          {stats.personalPenalties?.some(
                            (p) => p.asset?.id === asset.id,
                          ) && (
                            <button
                              onClick={() =>
                                setIncidentToSettle(
                                  stats.personalPenalties!.find(
                                    (p) => p.asset?.id === asset.id,
                                  )!,
                                )
                              }
                              className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-[10px] font-semibold uppercase tracking-widest shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Settle Penalty
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                            title="View Asset Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest opacity-20"
                      >
                        No Personal Unit Assignments Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={inventoryPage}
              totalPages={inventoryTotalPages}
              onPageChange={setInventoryPage}
              itemsPerPage={itemsPerPage}
              totalItems={stats.userAssets.length}
            />
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-orange-400" /> Transaction
                  Pipeline
                </h3>
                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest opacity-60">
                  Status of Acquisitions
                </p>
              </div>
              <Link
                to="/requests"
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-semibold uppercase tracking-widest hover:border-[#ff8000] hover:text-[#ff8000] transition-all flex items-center gap-2"
              >
                More <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
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
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-[#ff8000] transition-colors truncate mb-1">
                          {req.title}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[8px] font-semibold uppercase text-slate-400 tracking-widest">
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
                      <p className="text-base font-semibold text-slate-900 tracking-tight">
                        {(
                          req.financials?.grand_total ||
                          (req.estimated_unit_cost || 0) * (req.quantity || 0)
                        ).toLocaleString()}{' '}
                        <span className="text-[9px] text-slate-400">RWF</span>
                      </p>
                      <div
                        className={`px-3 py-1 rounded-md text-[8px] font-semibold uppercase tracking-widest border shadow-sm ${
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
            <Pagination
              currentPage={requestsPage}
              totalPages={requestsTotalPages}
              onPageChange={setRequestsPage}
              itemsPerPage={itemsPerPage}
              totalItems={stats.recentRequests.length}
            />
          </div>

          <ConfirmActionModal
            isOpen={!!incidentToSettle}
            onClose={() => setIncidentToSettle(null)}
            onConfirm={() => {
              if (incidentToSettle) {
                penaltyMutation.mutate(incidentToSettle.id);
              }
            }}
            title="Confirm Payment"
            message={`Confirm that you have settled the penalty of **${Number(incidentToSettle?.penalty_amount).toLocaleString()} RWF** for incident **#${incidentToSettle?.id.slice(0, 8).toUpperCase()}**?`}
            confirmText="Yes, Settled"
            cancelText="No, Pending"
            variant="danger"
            isLoading={penaltyMutation.isPending}
          />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:border-[#ff8000] transition-all">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#ff8000]/5 rounded-full blur-[40px] translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-orange-200 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-[#ff8000]" />
              </div>
              <h4 className="text-sm font-semibold uppercase tracking-widest mb-2 text-slate-900">
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
                className="w-full py-3 bg-[#ff8000] hover:bg-[#e49f37] text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all shadow-lg shadow-orange-100"
              >
                Assign Asset
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">
              Financial Health
            </h3>
            <div className="space-y-6">
              {stats.topCategories.map(([name, data]) => (
                <div key={name} className="group/item">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 group-hover/item:text-slate-900 transition-colors">
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
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#ff8000] mb-1 leading-none">
                Resource Erosion
              </p>
              <h4 className="text-lg font-semibold text-slate-800 tracking-tight flex items-center justify-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />{' '}
                {stats.totalDepreciation.toLocaleString()}{' '}
                <span className="text-[9px] text-slate-400">RWF</span>
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
  );
};
