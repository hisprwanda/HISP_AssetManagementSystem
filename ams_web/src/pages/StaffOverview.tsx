import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LifeBuoy,
  ShieldAlert,
  Box,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Asset, AssetIncident } from '../types/assets';
import { ViewAssetModal } from '../components/ViewAssetModal';

export const StaffOverview = () => {
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
    if (!assets) return null;

    const userAssets = assets.filter(
      (a) => a.assigned_to?.id === currentUser?.id,
    );

    return {
      userAssets,
      userAssetsCount: userAssets.length,
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
                <LifeBuoy className="w-3.5 h-3.5" /> Personnel Portal
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {currentUser?.department?.name || 'Operations'} Directorate
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
              My Asset Overview
            </h1>
            <p className="text-slate-500 font-medium text-xs max-w-xl leading-relaxed">
              Real-time monitoring of your assigned organizational equipment and
              active incident logistics.
            </p>
          </div>
        </div>

        <div className="w-full space-y-10">
          {stats.recentOutcomes.length > 0 && (
            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 group">
              <div className="p-4 border-b border-slate-100/50 flex items-center justify-between bg-white/40">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                  <div className="w-1.5 h-4 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                  Critical Path Outcomes
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100/50 bg-slate-50/50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Verdict
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Asset
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Resolution summary
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
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
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 text-right">
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
          )}

          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="p-4 border-b border-slate-100/50 flex items-center justify-between bg-white/40">
              <h3 className="text-[11px] font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase tracking-widest">
                <div className="w-1.5 h-4 bg-[#ff8000] rounded-full shadow-[0_0_12px_rgba(255,128,0,0.3)]" />
                My Asset Inventory
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100/50 bg-slate-50/50">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Asset
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Category
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Assignment Date
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {stats.userAssets.length > 0 ? (
                    stats.userAssets.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-orange-50 group-hover:border-orange-100">
                              <Box className="w-4 h-4 text-slate-400 group-hover:text-[#ff8000]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 tracking-tight leading-none mb-1 group-hover:text-[#ff8000]">
                                {asset.name}
                              </p>
                              <code className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {asset.tag_id || 'NON-TAGGED'}
                              </code>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-200/50">
                            {asset.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm ${
                              asset.status === 'BROKEN'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : asset.status === 'MISSING'
                                  ? 'bg-red-50 text-red-600 border-red-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                asset.status === 'BROKEN'
                                  ? 'bg-amber-500'
                                  : asset.status === 'MISSING'
                                    ? 'bg-red-500'
                                    : 'bg-emerald-500'
                              }`}
                            />
                            {asset.status === 'BROKEN'
                              ? 'Broken'
                              : asset.status === 'MISSING'
                                ? 'Missing'
                                : 'Assigned'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 opacity-40 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg"
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
                        className="py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-20"
                      >
                        No Unit Assignments Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-8 mt-4 border-t border-slate-100 flex flex-col items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 text-orange-400" /> System
              Protocol Notice
            </p>
            <p className="text-[9px] text-slate-400 leading-relaxed font-semibold max-w-2xl italic">
              Assets listed in this registry are officially tied to your
              personnel record. For transfer requests, discrepancy reporting, or
              off-boarding protocols, please contact the{' '}
              <span className="text-slate-600 font-bold">
                Operations Directorate
              </span>{' '}
              immediately.
            </p>
          </div>
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
