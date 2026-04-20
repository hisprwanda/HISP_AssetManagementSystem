import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Monitor,
  Smartphone,
  Printer,
  Box,
  Users,
  Laptop,
  ShieldAlert,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Asset, AssetIncident, AssetAssignment } from '../types/assets';
import { ViewAssetModal } from '../components/ViewAssetModal';
import { AssetReceiptFormModal } from '../components/AssetReceiptFormModal';

export const HODOverview = () => {
  const { user: currentUser } = useAuth();
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [signingAssignment, setSigningAssignment] =
    useState<AssetAssignment | null>(null);

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const { data: incidents } = useQuery<AssetIncident[]>({
    queryKey: ['my-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
  });

  const stats = useMemo(() => {
    if (!assets || !currentUser?.department?.id) return null;

    const departmentAssets = assets.filter(
      (a) =>
        a.department?.id === currentUser?.department?.id &&
        a.status !== 'DISPOSED',
    );

    const personalAssets = departmentAssets.filter(
      (a) => a.assigned_to?.id === currentUser?.id && !a.is_shared,
    );
    const staffAssets = departmentAssets.filter(
      (a) => a.assigned_to?.id !== currentUser?.id && !a.is_shared,
    );
    const sharedAssets = departmentAssets.filter((a) => a.is_shared);

    return {
      total: departmentAssets.length,
      personalAssets,
      staffAssets,
      sharedAssets,
      recentOutcomes: incidents
        ? incidents
            .filter(
              (i) =>
                i.reported_by?.id === currentUser?.id &&
                (i.investigation_status === 'ACCEPTED' ||
                  i.investigation_status === 'DENIED'),
            )
            .sort(
              (a, b) =>
                new Date(b.reported_at).getTime() -
                new Date(a.reported_at).getTime(),
            )
            .slice(0, 3)
        : [],
    };
  }, [assets, incidents, currentUser]);

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
      return 'bg-orange-600 text-white border-orange-500 font-black shadow-md';
    }
    switch (asset.status) {
      case 'IN_STOCK':
        return 'bg-orange-50 text-orange-950 border-orange-200 font-black';
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
    <div className="relative min-h-screen -m-6 p-6 bg-slate-50/50">
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-orange-100 text-[9px] font-black uppercase tracking-[0.2em] text-[#ff8000] flex items-center gap-1.5 shadow-sm">
                <Building2 className="w-3.5 h-3.5" /> Department Portal
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {currentUser?.department?.name || 'Unknown'} Directorate
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
              HOD Overview Dashboard
            </h1>
            <p className="text-slate-500 font-medium text-xs max-w-xl leading-relaxed">
              Manage your department's shared resources and monitor
              staff-assigned equipment with real-time incident logistics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Box className="w-5 h-5 text-[#ff8000]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Total Dept Assets
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {stats.total}
              </p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <Users className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Shared Assets
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {stats.sharedAssets.length}
              </p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-[#ff8000]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Your Assets
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {stats.personalAssets.length}
              </p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
              <Users className="w-5 h-5 text-[#ff8000]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Staff Assets
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {stats.staffAssets.length}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-[#ff8000] rounded-full shadow-[0_0_10px_rgba(255,128,0,0.3)]" />
                Your Personally Assigned Equipment
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8000] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                {stats.personalAssets.length} Personal Items
              </span>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-orange-100/30 bg-orange-50/20">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Asset Details
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tag / Serial
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Status & Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.personalAssets.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff8000]">
                              {getAssetIcon(asset.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800 tracking-tight">
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
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(asset)}`}
                          >
                            {asset.status.replace('_', ' ')}
                          </span>
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
                        <td
                          colSpan={3}
                          className="py-12 text-center opacity-40"
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            No personal equipment assigned
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                Shared Departmental Resources
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {stats.sharedAssets.length} Resources
              </span>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Resource
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Currently Held By
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Location
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.sharedAssets.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                              {getAssetIcon(asset.name)}
                            </div>
                            <span className="text-sm font-black text-slate-800 leading-tight">
                              {asset.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {asset.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-600">
                                {asset.assigned_to.full_name.charAt(0)}
                              </div>
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                {asset.assigned_to.full_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic uppercase">
                              Department Pooled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-400 italic font-serif">
                            {asset.location || 'HQ Stores'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(asset)}`}
                          >
                            {asset.status.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-slate-200 rounded-full shadow-inner" />
                Directorate Staff Equipment
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {stats.staffAssets.length} Staff-Held Items
              </span>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Staff Member
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Assigned Asset
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Category
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Incident Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.staffAssets.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                              {asset.assigned_to?.full_name?.charAt(0) || '?'}
                            </div>
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                              {asset.assigned_to?.full_name ||
                                'Pooled / In Stock'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff8000]">
                              {getAssetIcon(asset.name)}
                            </div>
                            <span className="text-sm font-black text-slate-800 tracking-tight leading-none">
                              {asset.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-200/50">
                            {asset.category?.name || 'Hardware'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                          <div
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(asset)}`}
                          >
                            {asset.status === 'IN_STOCK' &&
                            asset.assignment_history?.some(
                              (a) => a.form_status === 'PENDING_USER_SIGNATURE',
                            )
                              ? 'Signature Required'
                              : asset.status.replace('_', ' ')}
                          </div>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {stats.recentOutcomes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-orange-200 rounded-full shadow-[0_0_10px_rgba(255,128,0,0.2)]" />{' '}
                Critical Path Outcomes
              </h3>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100/50 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Verdict
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Asset
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Resolution summary
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {stats.recentOutcomes.map((incident) => (
                      <tr
                        key={incident.id}
                        className="group/row hover:bg-white/60"
                      >
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-transparent ${
                              incident.investigation_status === 'ACCEPTED'
                                ? 'bg-orange-50 text-orange-950 border-orange-200'
                                : 'bg-orange-50 text-orange-600 border-orange-100'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${incident.investigation_status === 'ACCEPTED' ? 'bg-white' : 'bg-orange-600'}`}
                            />
                            {incident.investigation_status === 'ACCEPTED'
                              ? 'Approved'
                              : 'Denied'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                              <Box className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <p className="text-xs font-bold text-slate-800 tracking-tight leading-tight truncate">
                                {incident.asset?.name}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Case #{incident.id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 max-w-sm">
                              <p className="text-xs font-semibold text-slate-500 leading-relaxed italic line-clamp-1">
                                {incident.investigation_status === 'ACCEPTED'
                                  ? 'Replacement requisition initiated. Check My Requests tab.'
                                  : `Claim Denied: ${incident.investigation_remarks || 'Awaiting financial resolution.'}`}
                              </p>
                              {incident.investigation_status === 'DENIED' && (
                                <div className="mt-1.5 flex items-center gap-3">
                                  {incident.penalty_resolved_at ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                      CLEARED:{' '}
                                      {Number(
                                        incident.penalty_amount || 0,
                                      ).toLocaleString()}{' '}
                                      RWF
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-orange-600 font-black text-[9px] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                                      <AlertCircle className="w-3 h-3" />{' '}
                                      Penalty:{' '}
                                      {Number(
                                        incident.penalty_amount || 0,
                                      ).toLocaleString()}{' '}
                                      RWF
                                    </div>
                                  )}
                                  <button
                                    onClick={() =>
                                      setResolutionNotice(
                                        incident.penalty_resolved_at
                                          ? 'This penalty has been fully settled and cleared from your record.'
                                          : 'Please contact the Directorate of Finance and Administration (DFA) regarding penalty resolution and asset clearance.',
                                      )
                                    }
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                    title="Resolution Instructions"
                                  >
                                    <AlertCircle className="w-3 h-3 rotate-180" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-2 py-1 rounded-lg">
                            {new Date(incident.reported_at).toLocaleDateString(
                              'en-GB',
                              { day: '2-digit', month: 'short' },
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="pt-8 mt-4 border-t border-slate-100 flex flex-col items-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3 text-orange-400" /> System Protocol
            Notice
          </p>
          <p className="text-[9px] text-slate-400 leading-relaxed font-semibold max-w-2xl italic">
            Departmental assets are officially tied to the directorate record.
            For transfer requests, discrepancy reporting, or off-boarding
            protocols, please contact the{' '}
            <span className="text-slate-600 font-bold">
              Operations Directorate
            </span>{' '}
            immediately.
          </p>
        </div>
      </div>

      {resolutionNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-white/20 relative">
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={() => setResolutionNotice(null)}
                className="p-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-black"
              >
                ✕
              </button>
            </div>
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-[#ff8000]" />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Penalty Resolution
            </h4>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-8 italic">
              {resolutionNotice}
            </p>
            <button
              onClick={() => setResolutionNotice(null)}
              className="w-full py-4 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 shadow-xl"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}

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
