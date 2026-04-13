import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Search,
  Eye,
  Calendar,
  User as UserIcon,
  Laptop,
  Clock,
  Trash2,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { ResolveIncidentModal } from '../components/ResolveIncidentModal';
import { ViewIncidentModal } from '../components/ViewIncidentModal';
import { useAuth } from '../hooks/useAuth';
import { AssetIncident } from '../types/assets';

export const Incidents = () => {
  const navigate = useNavigate();
  const { isFinanceAdmin, isAdmin, isHOD, isCEO, user } = useAuth();
  const { openIncident } = useOutletContext<{ openIncident: () => void }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] =
    useState<AssetIncident | null>(null);
  const [incidentToView, setIncidentToView] = useState<AssetIncident | null>(
    null,
  );
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Incident Reports');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: incidents, isLoading } = useQuery<AssetIncident[]>({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
  });

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    let result = incidents;

    if (isHOD && !isAdmin && !isFinanceAdmin) {
      result = result.filter(
        (i) =>
          i.reported_by?.department?.id === user?.department?.id ||
          i.asset?.department?.id === user?.department?.id,
      );
    }

    if (filterType !== 'ALL') {
      result = result.filter((i) => i.incident_type === filterType);
    }

    if (filterStatus !== 'ALL') {
      result = result.filter((i) => i.investigation_status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.asset?.name?.toLowerCase().includes(q) ||
          i.reported_by?.full_name?.toLowerCase().includes(q) ||
          i.explanation?.toLowerCase().includes(q),
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
  }, [
    incidents,
    filterType,
    filterStatus,
    searchQuery,
    startDate,
    endDate,
    isAdmin,
    isFinanceAdmin,
    isHOD,
    user,
  ]);

  const stats = useMemo(() => {
    if (!incidents) return { investigating: 0, accepted: 0, denied: 0 };

    let filteredForStats = incidents;
    if (isHOD && !isAdmin && !isFinanceAdmin) {
      filteredForStats = incidents.filter(
        (i) =>
          i.reported_by?.department?.id === user?.department?.id ||
          i.asset?.department?.id === user?.department?.id,
      );
    }

    return {
      investigating: filteredForStats.filter(
        (i) => i.investigation_status === 'INVESTIGATING',
      ).length,
      accepted: filteredForStats.filter(
        (i) => i.investigation_status === 'ACCEPTED',
      ).length,
      denied: filteredForStats.filter(
        (i) => i.investigation_status === 'DENIED',
      ).length,
    };
  }, [incidents, isHOD, isAdmin, isFinanceAdmin, user]);

  const getStatusStyle = (status: AssetIncident['investigation_status']) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-slate-50 text-slate-950 border-slate-200 font-black';
      case 'DENIED':
        return 'bg-orange-50 text-orange-600 border-orange-100 italic';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const handleResolve = (incident: AssetIncident) => {
    setSelectedIncident(incident);
    setIsResolveModalOpen(true);
  };

  const getDepartmentName = (inc: AssetIncident) => {
    if (typeof inc.asset?.department === 'string') return inc.asset.department;
    if (inc.asset?.department?.name) return inc.asset.department.name;

    if (typeof inc.reported_by?.department === 'string')
      return inc.reported_by.department;
    if (inc.reported_by?.department?.name)
      return inc.reported_by.department.name;
    return 'Operations / Central';
  };

  const getInvestigationRemarks = (inc: AssetIncident) => {
    return inc.investigation_remarks || '';
  };

  const handleExportLogs = () => {
    if (!filteredIncidents.length) return;

    const headers = [
      'Incident ID',
      'Date Reported',
      'Incident Type',
      'Asset Name',
      'Tag ID',
      'Serial Number',
      'Reporter',
      'Department',
      'Investigation Status',
      'Explanation',
      'Resolution Remarks',
    ];

    const escapeCSV = (val: string) => {
      if (val === null || val === undefined) return '';
      const stringified = String(val);
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    const rows = filteredIncidents.map((inc) => [
      escapeCSV(`#${inc.id.slice(0, 8).toUpperCase()}`),
      escapeCSV(new Date(inc.reported_at).toLocaleDateString()),
      escapeCSV(inc.incident_type),
      escapeCSV(inc.asset?.name || 'N/A'),
      escapeCSV(inc.asset?.tag_id || 'N/A'),
      escapeCSV(inc.asset?.serial_number || 'N/A'),
      escapeCSV(inc.reported_by?.full_name || 'N/A'),
      escapeCSV(getDepartmentName(inc)),
      escapeCSV(inc.investigation_status),
      escapeCSV(inc.explanation || ''),
      escapeCSV(getInvestigationRemarks(inc)),
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
    link.setAttribute('download', `investigation_logs_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin && !isFinanceAdmin && !isHOD && !isCEO) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 border border-red-100">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
          Access Restricted
        </h1>
        <p className="text-slate-500 font-medium max-w-sm">
          Investigations and audit logs are only accessible to Administration,
          Finance, Department Heads, and Executive Leadership.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <div className="flex-1" />
        <div className="flex gap-2">
          {(isHOD || isAdmin || isCEO) && (
            <button
              onClick={openIncident}
              className="px-4 py-2 bg-orange-600 border border-orange-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-orange-200" /> Report
              Incident
            </button>
          )}
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm hover:bg-slate-50 flex items-center gap-2 group"
          >
            <Download className="w-3.5 h-3.5 text-[#ff8000]" /> Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
              <Clock className="w-4 h-4 text-[#ff8000]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                Open Cases
              </p>
              <h3 className="text-lg font-black text-slate-800 leading-none">
                {stats.investigating}{' '}
                <span className="text-[9px] font-bold text-slate-400">
                  PENDING
                </span>
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                Accepted
              </p>
              <h3 className="text-lg font-black text-slate-800 leading-none">
                {stats.accepted}{' '}
                <span className="text-[9px] font-bold text-slate-300">
                  RESOLVED
                </span>
              </h3>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/penalties')}
          className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 group-hover:bg-orange-100 transition-colors">
              <ShieldX className="w-4 h-4 text-[#ff8000]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5 group-hover:text-[#ff8000] transition-colors">
                Denied
              </p>
              <h3 className="text-lg font-black text-slate-800 leading-none">
                {stats.denied}{' '}
                <span className="text-[9px] font-bold text-orange-200">
                  PENALTIES
                </span>
              </h3>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-3 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset, tag, or personnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 px-2 rounded-lg border border-slate-200">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Audit Period:
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
                className="ml-2 p-0.5 hover:bg-white rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 p-1 bg-slate-100/50 rounded-lg">
            {['ALL', 'BROKEN', 'MISSING'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-[#ff8000] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-1 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Status</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="DENIED">DENIED</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Incident Details
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Affected Asset
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Reporter & Department
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status & Outcome
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-20 text-center text-xs font-black text-slate-300 uppercase tracking-widest"
                  >
                    Compiling Investigation Data...
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                            inc.incident_type === 'MISSING'
                              ? 'bg-slate-50 text-slate-400 border-slate-100'
                              : 'bg-orange-50 text-orange-500 border-orange-100'
                          }`}
                        >
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            #{inc.id.slice(0, 8).toUpperCase()} -{' '}
                            {inc.incident_type}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter truncate max-w-[200px]">
                            {inc.explanation}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-700 flex items-center gap-2">
                          <Laptop className="w-3.5 h-3.5 text-slate-400" />{' '}
                          {inc.asset?.name || 'Legacy Asset'}
                        </span>
                        <span className="text-[8px] font-black text-[#ff8000] uppercase tracking-widest">
                          {inc.asset?.tag_id || 'NO TAG'}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-700 flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />{' '}
                          {inc.reported_by?.full_name}
                        </span>
                        <span className="text-[8px] font-black text-[#ff8000] uppercase tracking-widest">
                          {getDepartmentName(inc)}
                        </span>
                        <span className="text-[8px] font-black text-slate-300 uppercase mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />{' '}
                          {new Date(inc.reported_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2">
                        <div
                          className={`inline-flex self-start px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(inc.investigation_status)} shadow-sm`}
                        >
                          {inc.investigation_status}
                        </div>
                        {getInvestigationRemarks(inc) && (
                          <p
                            className="text-[9px] font-bold text-slate-500 italic max-w-[150px] truncate"
                            title={getInvestigationRemarks(inc)}
                          >
                            "{getInvestigationRemarks(inc)}"
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 pr-2">
                        {inc.investigation_status === 'INVESTIGATING' &&
                          (isAdmin || isFinanceAdmin || isCEO) && (
                            <button
                              onClick={() => handleResolve(inc)}
                              className="p-2 bg-orange-50 text-[#ff8000] hover:bg-[#ff8000] hover:text-white rounded-lg transition-all shadow-sm border border-orange-100"
                              title="Resolve Investigation"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                        <button
                          onClick={() => setIncidentToView(inc)}
                          className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-all border border-slate-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(isFinanceAdmin || isAdmin || isCEO) && (
                          <button className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {(!incidents || filteredIncidents.length === 0) && !isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-32 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-100 mb-4" />
                      <p className="text-sm font-black uppercase tracking-[0.2em] opacity-40">
                        No investigation logs found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
          <span>{filteredIncidents.length} Investigations Registered</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> Pending
              Audit
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" /> Case
              Resolved
            </span>
          </div>
        </div>
      </div>

      {selectedIncident && (
        <ResolveIncidentModal
          isOpen={isResolveModalOpen}
          onClose={() => {
            setIsResolveModalOpen(false);
            setSelectedIncident(null);
          }}
          incident={selectedIncident}
        />
      )}

      <ViewIncidentModal
        isOpen={!!incidentToView}
        onClose={() => setIncidentToView(null)}
        incident={incidentToView}
      />
    </div>
  );
};
