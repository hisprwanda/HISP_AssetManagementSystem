import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldX,
  Search,
  Eye,
  Calendar,
  User as UserIcon,
  Laptop,
  Clock,
  CheckCircle2,
  Banknote,
  Hammer,
} from 'lucide-react';
import { api } from '../lib/api';
import { ResolveIncidentModal } from '../components/ResolveIncidentModal';
import { ViewIncidentModal } from '../components/ViewIncidentModal';
import { useAuth } from '../hooks/useAuth';
import { AssetIncident } from '../types/assets';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { Pagination } from '../components/Pagination';

export const Incidents = () => {
  const queryClient = useQueryClient();
  const { isFinanceAdmin, isAdmin, isHOD, isCEO, user } = useAuth();
  const { openIncident } = useOutletContext<{ openIncident: () => void }>();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] =
    useState<AssetIncident | null>(null);
  const [incidentToView, setIncidentToView] = useState<AssetIncident | null>(
    null,
  );
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [incidentToSettle, setIncidentToSettle] =
    useState<AssetIncident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Incidents Report');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const [filterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incidents, isLoading } = useQuery<AssetIncident[]>({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
  });

  const penaltyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/asset-incidents/${id}/resolve-penalty`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
    },
  });

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    let result = incidents;

    if (isHOD && !isAdmin && !isFinanceAdmin && !isCEO) {
      result = result.filter(
        (i) =>
          i.reported_by?.department?.id === user?.department?.id ||
          i.asset?.department?.id === user?.department?.id,
      );
    }

    if (isCEO && !isAdmin && !isFinanceAdmin) {
      result = result.filter(
        (i) =>
          (i.status || i.investigation_status) === 'CEO_REVIEW' ||
          i.status?.startsWith('RESOLVED') ||
          i.investigation_status === 'ACCEPTED' ||
          i.status === 'REJECTED_LIABILITY' ||
          i.investigation_status === 'DENIED',
      );
    }

    if (filterType !== 'ALL') {
      result = result.filter((i) => i.incident_type === filterType);
    }

    if (filterStatus !== 'ALL') {
      result = result.filter(
        (i) => (i.status || i.investigation_status) === filterStatus,
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.asset?.name?.toLowerCase().includes(q) ||
          i.reported_by?.full_name?.toLowerCase().includes(q) ||
          (i.issue_description || i.explanation || '')
            .toLowerCase()
            .includes(q),
      );
    }

    return result;
  }, [
    incidents,
    filterType,
    filterStatus,
    searchQuery,
    isCEO,
    isHOD,
    isAdmin,
    isFinanceAdmin,
    user,
  ]);

  const stats = useMemo(() => {
    if (!incidents)
      return {
        pending: 0,
        repairing: 0,
        resolved: 0,
        liability: 0,
        settled: 0,
      };

    let filtered = incidents;
    if (isHOD && !isAdmin && !isFinanceAdmin && !isCEO) {
      filtered = incidents.filter(
        (i) =>
          i.reported_by?.department?.id === user?.department?.id ||
          i.asset?.department?.id === user?.department?.id,
      );
    }

    if (isCEO && !isAdmin && !isFinanceAdmin) {
      filtered = incidents.filter(
        (i) =>
          (i.status || i.investigation_status) === 'CEO_REVIEW' ||
          i.status?.startsWith('RESOLVED') ||
          i.investigation_status === 'ACCEPTED' ||
          i.status === 'REJECTED_LIABILITY' ||
          i.investigation_status === 'DENIED',
      );
    }

    return {
      pending: filtered.filter(
        (i) =>
          (i.status || i.investigation_status) === 'PENDING' ||
          (i.status || i.investigation_status) === 'CEO_REVIEW' ||
          i.investigation_status === 'INVESTIGATING',
      ).length,
      repairing: filtered.filter((i) => i.status === 'IN_REPAIR').length,
      resolved: filtered.filter(
        (i) =>
          i.status?.startsWith('RESOLVED') ||
          i.investigation_status === 'ACCEPTED',
      ).length,
      liability: filtered.filter(
        (i) =>
          (i.status === 'REJECTED_LIABILITY' ||
            i.investigation_status === 'DENIED') &&
          !i.penalty_resolved_at,
      ).length,
      settled: filtered.filter((i) => i.penalty_resolved_at).length,
    };
  }, [incidents, isCEO, isHOD, isAdmin, isFinanceAdmin, user]);

  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIncidents.slice(start, start + itemsPerPage);
  }, [filteredIncidents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RESOLVED_FIXED':
      case 'RESOLVED_REPLACED':
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold';
      case 'REJECTED_LIABILITY':
      case 'DENIED':
        return 'bg-red-50 text-red-600 border-red-100 font-bold';
      case 'IN_REPAIR':
        return 'bg-blue-50 text-blue-600 border-blue-100 font-bold';
      case 'PENDING':
      case 'INVESTIGATING':
      case 'CEO_REVIEW':
        return 'bg-amber-50 text-amber-600 border-amber-100 font-bold animate-pulse';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const handleResolve = (incident: AssetIncident) => {
    setSelectedIncident(incident);
    setIsResolveModalOpen(true);
  };

  if (!isAdmin && !isFinanceAdmin && !isHOD && !isCEO) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 border border-red-100">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none mb-3">
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
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1" />
          {(isHOD || isAdmin || isCEO) && (
            <button
              onClick={openIncident}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-100 hover:bg-orange-700 flex items-center gap-2 group"
            >
              <ShieldAlert className="w-4 h-4 text-orange-200" /> Report
              Equipment Issue
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Pending Review',
              value: stats.pending,
              icon: Clock,
              color: 'amber',
              sub: 'NEW',
            },
            {
              label: 'In Repair',
              value: stats.repairing,
              icon: Hammer,
              color: 'blue',
              sub: 'ACTIVE',
            },
            {
              label: 'Resolved',
              value: stats.resolved,
              icon: CheckCircle2,
              color: 'emerald',
              sub: 'DONE',
            },
            {
              label: 'Liability Cases',
              value: stats.liability,
              icon: ShieldAlert,
              color: 'red',
              sub: 'BILLABLE',
            },
            {
              label: 'Penalty Settled',
              value: stats.settled,
              icon: Banknote,
              color: 'slate',
              sub: 'CLEARED',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center border border-${stat.color}-100`}
              >
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  {stat.label}
                </p>
                <h3 className="text-xl font-bold text-slate-800 leading-none">
                  {stat.value}{' '}
                  <span className="text-[10px] font-bold text-slate-300 ml-1">
                    {stat.sub}
                  </span>
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white p-2 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by asset, tag, or personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-sm focus:ring-0 outline-none font-bold text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_REPAIR">IN REPAIR</option>
              <option value="RESOLVED_FIXED">RESOLVED (FIXED)</option>
              <option value="RESOLVED_REPLACED">RESOLVED (REPLACED)</option>
              <option value="REJECTED_LIABILITY">REJECTED (LIABILITY)</option>
              <option value="CEO_REVIEW">CEO REVIEW</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Incident Details
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Affected Asset
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Reporter
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest animate-pulse"
                    >
                      Synchronizing Helpdesk Records...
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  paginatedIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${inc.incident_type === 'MISSING' ? 'bg-slate-50 text-slate-400' : 'bg-orange-50 text-orange-500'}`}
                          >
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              #{inc.id.slice(0, 8).toUpperCase()} -{' '}
                              {inc.incident_type}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter truncate max-w-[200px]">
                              {inc.issue_description || inc.explanation}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />{' '}
                            {inc.asset?.name || 'Legacy Asset'}
                          </span>
                          <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1">
                            {inc.asset?.tag_id || 'NO TAG'}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />{' '}
                            {inc.reported_by?.full_name}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />{' '}
                            {new Date(inc.reported_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div
                          className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border shadow-sm ${getStatusStyle(inc.status || inc.investigation_status || 'PENDING')}`}
                        >
                          {inc.status || inc.investigation_status || 'PENDING'}
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          {(isAdmin || isFinanceAdmin || isCEO) &&
                            (inc.status === 'PENDING' ||
                              inc.status === 'IN_REPAIR' ||
                              inc.status === 'CEO_REVIEW' ||
                              inc.investigation_status === 'INVESTIGATING') && (
                              <button
                                onClick={() => handleResolve(inc)}
                                className="p-2 bg-slate-900 text-white hover:bg-black rounded-lg transition-all shadow-sm transform active:scale-90"
                                title="Resolve Ticket"
                              >
                                <Hammer className="w-4 h-4" />
                              </button>
                            )}
                          <button
                            onClick={() => setIncidentToView(inc)}
                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 rounded-lg transition-all shadow-sm transform active:scale-90"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(inc.status === 'REJECTED_LIABILITY' ||
                            inc.investigation_status === 'DENIED') &&
                            (isAdmin || isFinanceAdmin) && (
                              <button
                                onClick={() => {
                                  if (!inc.penalty_resolved_at) {
                                    setIncidentToSettle(inc);
                                  }
                                }}
                                className={`p-2 rounded-lg border shadow-sm transition-all ${inc.penalty_resolved_at ? 'bg-emerald-50 border-emerald-100 text-emerald-500 cursor-default' : 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'}`}
                              >
                                {inc.penalty_resolved_at ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Banknote className="w-4 h-4" />
                                )}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredIncidents.length}
          />
        </div>

        <ResolveIncidentModal
          isOpen={isResolveModalOpen}
          onClose={() => {
            setIsResolveModalOpen(false);
            setSelectedIncident(null);
          }}
          incident={selectedIncident!}
        />

        <ViewIncidentModal
          isOpen={!!incidentToView}
          onClose={() => setIncidentToView(null)}
          incident={incidentToView}
        />

        <ConfirmActionModal
          isOpen={!!incidentToSettle}
          onClose={() => setIncidentToSettle(null)}
          onConfirm={() => {
            if (incidentToSettle) {
              penaltyMutation.mutate(incidentToSettle.id);
            }
          }}
          title="Confirm Payment"
          message={`Confirm that the penalty for #${incidentToSettle?.id.slice(0, 8).toUpperCase()} has been fully settled?`}
          confirmText="Yes, Settled"
          cancelText="No, Pending"
          variant="info"
          isLoading={penaltyMutation.isPending}
        />
      </div>
    </>
  );
};
