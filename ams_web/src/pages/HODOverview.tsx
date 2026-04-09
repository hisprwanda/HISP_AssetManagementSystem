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
import { Asset, AssetIncident } from '../types/assets';
import { ViewAssetModal } from '../components/ViewAssetModal';

export const HODOverview = () => {
  const { user: currentUser } = useAuth();
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

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
      (a) => a.department?.id === currentUser?.department?.id,
    );

    const sharedAssets = departmentAssets.filter((a) => !a.assigned_to);
    const individualAssets = departmentAssets.filter((a) => !!a.assigned_to);

    return {
      total: departmentAssets.length,
      sharedAssets,
      individualAssets,
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ASSIGNED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'BROKEN':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'MISSING':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (!stats) return null;

  return (
    <div className="relative min-h-screen -m-6 p-6 overflow-hidden bg-slate-50/50">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[140px] translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 space-y-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Individual Staff Assets
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {stats.individualAssets.length}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Shared Assets Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" /> Shared
                Department Resources
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {stats.sharedAssets.length} Items Total
              </span>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Asset / Model
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tag ID
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Category
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
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all scale-90">
                              {getAssetIcon(asset.name)}
                            </div>
                            <span className="text-sm font-black text-slate-800 tracking-tight">
                              {asset.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs font-bold text-slate-500 font-mono tracking-tighter bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                            {asset.tag_id || 'NON-TAGGED'}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-200/50">
                            {asset.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-400 italic">
                            {asset.location || 'General Stores'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(asset.status)}`}
                          >
                            {asset.status}
                          </span>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                            title="View Asset Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stats.sharedAssets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Box className="w-8 h-8 text-slate-400 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              No shared inventory items found
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Individual Staff Assets Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />{' '}
                Staff-Assigned Equipment
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {stats.individualAssets.length} Staff-Held
              </span>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Asset Name
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Assigned To
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Category
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.individualAssets.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all scale-90">
                              {getAssetIcon(asset.name)}
                            </div>
                            <span className="text-sm font-black text-slate-800 tracking-tight">
                              {asset.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-[#ff8000]">
                              {asset.assigned_to?.full_name?.charAt(0)}
                            </div>
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                              {asset.assigned_to?.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-200/50">
                            {asset.category?.name || 'System Hardware'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(asset.status)}`}
                          >
                            {asset.status}
                          </span>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                            title="View Asset Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stats.individualAssets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Laptop className="w-8 h-8 text-slate-400 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              No assigned assets currently tracked
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Path Outcomes Table - Positioning below Staff-Assigned list as per user request */}
        {stats.recentOutcomes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]" />{' '}
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
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${incident.investigation_status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-red-500'}`}
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
                                  <div className="flex items-center gap-1.5 text-red-600 font-black text-[9px] uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                                    <AlertCircle className="w-3 h-3" /> Penalty:{' '}
                                    {Number(
                                      incident.penalty_amount || 0,
                                    ).toLocaleString()}{' '}
                                    RWF
                                  </div>
                                  <button
                                    onClick={() =>
                                      setResolutionNotice(
                                        'Please contact the Directorate of Finance and Administration (DFA) penalty resolution and asset clearance.',
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-white/20 relative">
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={() => setResolutionNotice(null)}
                className="p-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-black"
              >
                ✕
              </button>
            </div>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Penalty Resolution
            </h4>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-8 italic">
              {resolutionNotice}
            </p>
            <button
              onClick={() => setResolutionNotice(null)}
              className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl"
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
    </div>
  );
};
