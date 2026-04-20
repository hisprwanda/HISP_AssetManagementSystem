import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldX,
  Search,
  User as UserIcon,
  AlertCircle,
  ArrowLeft,
  Download,
  CheckCircle2,
  Banknote,
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AssetIncident } from '../types/assets';
import { ConfirmActionModal } from '../components/ConfirmActionModal';

export const Penalties = () => {
  const { isFinanceAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Pending Penalties');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [incidentToSettle, setIncidentToSettle] =
    useState<AssetIncident | null>(null);
  const queryClient = useQueryClient();

  const { data: incidents, isLoading } = useQuery<AssetIncident[]>({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
  });

  const settleMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/asset-incidents/${id}/resolve-penalty`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
    },
  });

  const filteredPenalties = useMemo(() => {
    if (!incidents) return [];

    let result = incidents.filter((i) => i.investigation_status === 'DENIED');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.asset?.name?.toLowerCase().includes(q) ||
          i.reported_by?.full_name?.toLowerCase().includes(q) ||
          i.asset?.serial_number?.toLowerCase().includes(q),
      );
    }

    if (startDate) {
      result = result.filter((i) => {
        const date = new Date(i.reported_at);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      result = result.filter((i) => {
        const date = new Date(i.reported_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    return result;
  }, [incidents, searchQuery, startDate, endDate]);

  const getDepartmentName = (inc: AssetIncident) => {
    if (typeof inc.asset?.department === 'string') return inc.asset.department;
    if (inc.asset?.department?.name) return inc.asset.department.name;

    if (typeof inc.reported_by?.department === 'string')
      return inc.reported_by.department;
    if (inc.reported_by?.department?.name)
      return inc.reported_by.department.name;

    return 'Operations / Central';
  };

  const handleExportLogs = () => {
    if (!filteredPenalties.length) return;

    const headers = [
      'Case ID',
      'Date Reported',
      'Asset Name',
      'Serial Number',
      'Billed To',
      'Directorate',
      'Reason For Denial',
      'Amount Owed (RWF)',
    ];

    const escapeCSV = (val: string | number | undefined) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredPenalties.map((inc) => [
      escapeCSV(`#${inc.id.slice(0, 8).toUpperCase()}`),
      escapeCSV(new Date(inc.reported_at).toLocaleDateString()),
      escapeCSV(inc.asset?.name),
      escapeCSV(inc.asset?.serial_number),
      escapeCSV(inc.reported_by?.full_name),
      escapeCSV(getDepartmentName(inc)),
      escapeCSV(inc.investigation_remarks || 'No remarks provided'),
      escapeCSV(inc.penalty_amount || 0),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `pending_penalties_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin && !isFinanceAdmin) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-6 border border-orange-100">
          <ShieldX className="w-10 h-10 text-[#ff8000]" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
          Access Restricted
        </h1>
        <p className="text-slate-500 font-medium max-w-sm">
          Penalty tracking is only accessible to Administration and Finance
          personnel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 px-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none p-0 cursor-pointer"
            />
            <span className="text-slate-300 mx-1">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none p-0 cursor-pointer"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="ml-2 p-1 hover:bg-slate-100 rounded-md transition-colors"
              >
                <ShieldX className="w-3 h-3 text-rose-400" />
              </button>
            )}
          </div>
          <button
            onClick={handleExportLogs}
            disabled={!filteredPenalties.length}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm hover:bg-slate-50 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />{' '}
            Export List
          </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff, asset name, or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-lg text-sm focus:ring-0 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex-1 flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#ff8000]/20 border-t-[#ff8000] rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Loading Penalties...
            </p>
          </div>
        )}

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Case ID
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Billed To
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">
                  Asset
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[200px]">
                  Reason for Denial
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                  Amount Owed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPenalties.map((inc) => (
                <tr
                  key={inc.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="p-4 py-5 align-top">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
                        <ShieldX className="w-3 h-3 text-[#ff8000]" />
                      </div>
                      <span className="text-[10px] font-black text-slate-900 tracking-wider">
                        #{inc.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                        <UserIcon className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {inc.reported_by?.full_name}
                      </span>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#ff8000] ml-7">
                      {getDepartmentName(inc)}
                    </p>
                  </td>
                  <td className="p-4 align-top hidden md:table-cell">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      {inc.asset?.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                      SN: {inc.asset?.serial_number || 'N/A'}
                    </p>
                  </td>
                  <td className="p-4 align-top max-w-[200px]">
                    <div className="bg-orange-50/50 rounded-lg p-2.5 border border-orange-100/50">
                      <div className="flex items-start gap-1.5 mb-1">
                        <AlertCircle className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-2">
                          {inc.investigation_remarks || 'No remarks given.'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="inline-flex flex-col items-end gap-2">
                      <span className="text-sm font-black text-[#ff8000] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                        {Number(inc.penalty_amount || 0).toLocaleString()} RWF
                      </span>
                      {inc.penalty_resolved_at ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[8px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 italic">
                          <CheckCircle2 className="w-2.5 h-2.5" /> PAID ON{' '}
                          {new Date(
                            inc.penalty_resolved_at,
                          ).toLocaleDateString()}
                        </div>
                      ) : (
                        <button
                          onClick={() => setIncidentToSettle(inc)}
                          className="flex items-center gap-1.5 text-orange-600 font-black text-[8px] uppercase tracking-widest bg-orange-50 px-2 py-1 rounded border border-orange-100 hover:bg-orange-100 transition-all shadow-sm active:scale-95 text-nowrap"
                        >
                          <Banknote className="w-3 h-3" /> SETTLE NOW
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredPenalties.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-1">
                        No Pending Penalties
                      </p>
                      <p className="text-xs text-slate-500">
                        There are currently no staff penalties tracking in the
                        system.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={!!incidentToSettle}
        onClose={() => setIncidentToSettle(null)}
        onConfirm={() => {
          if (incidentToSettle) {
            settleMutation.mutate(incidentToSettle.id);
          }
        }}
        title="Confirm Settlement"
        message={`Confirm that the penalty for #${incidentToSettle?.id.slice(0, 8).toUpperCase()} has been fully settled?`}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="info"
        isLoading={settleMutation.isPending}
      />
    </div>
  );
};
