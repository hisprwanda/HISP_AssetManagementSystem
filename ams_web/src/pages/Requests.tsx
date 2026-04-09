import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  FileText,
  Banknote,
  Building2,
  User as UserIcon,
  Check,
  X,
  Settings2,
  Activity,
  Download,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AssetRequest } from '../types/assets';
import { CreateRequestModal } from '../components/CreateRequestModal';
import { ViewRequestModal } from '../components/ViewRequestModal';
import { FormalizeRequestModal } from '../components/FormalizeRequestModal';

export const Requests = () => {
  const { user: currentUser, isAdmin, isHOD, isStaff } = useAuth();
  const isRequesterOnly = isStaff && !isAdmin && !isHOD;
  const queryClient = useQueryClient();
  const { openRequest } = useOutletContext<{ openRequest: () => void }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [requestMode, setRequestMode] = useState<
    'SHARED' | 'INDIVIDUAL' | undefined
  >(undefined);
  const [requestToFormalize, setRequestToFormalize] =
    useState<AssetRequest | null>(null);
  const [isFormalizeModalOpen, setIsFormalizeModalOpen] = useState(false);
  const [requestToView, setRequestToView] = useState<AssetRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null,
  );

  const { data: requests, isLoading } = useQuery<AssetRequest[]>({
    queryKey: ['assets-requests'],
    queryFn: async () => {
      const response = await api.get('/assets-requests');
      return response.data;
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.patch(`/assets-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
    },
  });
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    let filtered = requests;

    if (isStaff) {
      filtered = filtered.filter((r) => r.requested_by?.id === currentUser?.id);
    } else if (isHOD) {
      filtered = filtered.filter(
        (r) => r.department?.id === currentUser?.department?.id,
      );
    } else if (isAdmin) {
      // Admin should NOT see PENDING requests until they are HOD_APPROVED (Formalized)
      filtered = filtered.filter((r) => r.status !== 'PENDING');
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.department?.name?.toLowerCase().includes(q) ||
          r.requested_by?.full_name?.toLowerCase().includes(q),
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  }, [
    requests,
    filterStatus,
    searchQuery,
    currentUser,
    isHOD,
    isStaff,
    isAdmin,
  ]);

  const pendingCount =
    requests?.filter((r) => r.status === 'PENDING').length || 0;
  const pendingValue =
    requests
      ?.filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => {
        const val =
          r.financials?.grand_total ??
          (r.quantity || 0) * (r.estimated_unit_cost || 0);
        return sum + val;
      }, 0) || 0;
  const fulfilledCount =
    requests?.filter((r) => r.status === 'FULFILLED').length || 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'HOD_APPROVED':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'FULFILLED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50';
      case 'LOW':
        return 'text-slate-500 bg-slate-50';
      default:
        return 'text-slate-500 bg-slate-50';
    }
  };

  const handleFormalize = (req: AssetRequest) => {
    setRequestToFormalize(req);
    setRequestMode('INDIVIDUAL');
    setIsCreateModalOpen(true);
  };

  const handleExportLogs = () => {
    if (!filteredRequests.length) return;

    const headers = [
      'Request Title',
      'Requested By',
      'Directorate',
      'Total Est. Cost (RWF)',
      'Urgency',
      'Status',
      'Date Requested',
    ];

    const escapeCSV = (val: string | number | undefined) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredRequests.map((req) => {
      const cost =
        req.financials?.grand_total ??
        (req.quantity || 0) * (req.estimated_unit_cost || 0);
      return [
        escapeCSV(req.title),
        escapeCSV(req.requested_by?.full_name),
        escapeCSV(req.department?.name),
        escapeCSV(cost),
        escapeCSV(req.urgency),
        escapeCSV(req.status),
        escapeCSV(
          req.created_at ? new Date(req.created_at).toLocaleDateString() : '',
        ),
      ];
    });

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
    link.setAttribute('download', `procurement_requests_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            {isStaff && !isHOD ? (
              <Activity className="w-6 h-6 text-[#ff8000]" />
            ) : (
              <ShoppingCart className="w-6 h-6 text-[#ff8000]" />
            )}
            {isStaff && !isHOD ? 'My Asset Requests' : 'Procurement Requests'}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {isAdmin
              ? 'Manage hardware acquisitions and budget approvals.'
              : isHOD
                ? 'Review and formalize department requisitions.'
                : 'Track the status of your requested equipment.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isRequesterOnly && (
            <>
              <button
                onClick={handleExportLogs}
                disabled={!filteredRequests.length}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 text-sm rounded-xl font-bold shadow-sm transform active:scale-95 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />{' '}
                Request log
              </button>

              {isHOD ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setRequestMode('INDIVIDUAL');
                      setIsCreateModalOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group justify-center flex-1 sm:flex-none"
                  >
                    <UserIcon className="w-4 h-4" /> Request Individual Asset
                  </button>
                  <button
                    onClick={() => {
                      setRequestMode('SHARED');
                      setIsCreateModalOpen(true);
                    }}
                    className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 text-sm rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group justify-center flex-1 sm:flex-none"
                  >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />{' '}
                    Request Shared Asset
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    isStaff && !isHOD
                      ? openRequest()
                      : setIsCreateModalOpen(true)
                  }
                  className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 text-sm rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />{' '}
                  New Request
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${isRequesterOnly ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 mb-4`}
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              Pending Review
            </p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {pendingCount}{' '}
              <span className="text-xs font-bold text-slate-400">requests</span>
            </p>
          </div>
        </div>

        {!isRequesterOnly && (
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Est. Pending Budget
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {pendingValue.toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">RWF</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              Successfully Fulfilled
            </p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {fulfilledCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                assets deployed
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-4 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests..."
            className="w-full bg-transparent border-none pl-9 pr-4 py-1.5 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {[
            'ALL',
            'PENDING',
            'HOD_APPROVED',
            'APPROVED',
            'FULFILLED',
            'REJECTED',
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Request Item
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Requested By
                </th>
                {!isRequesterOnly && (
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Total Est. Cost
                  </th>
                )}
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Urgency
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={isRequesterOnly ? 5 : 6}
                    className="px-4 py-8 text-center text-sm text-slate-400 font-bold"
                  >
                    Loading requests...
                  </td>
                </tr>
              )}
              {!isLoading && filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={isRequesterOnly ? 5 : 6}
                    className="px-4 py-12 text-center text-sm text-slate-400 font-bold"
                  >
                    No procurement requests found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-white/60 transition-colors group"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-800 truncate">
                            {req.title}{' '}
                            {req.quantity ? (
                              <span className="text-slate-400 font-medium">
                                x{req.quantity}
                              </span>
                            ) : null}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {req.created_at
                              ? new Date(req.created_at).toLocaleDateString()
                              : 'Unknown Date'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <span className="text-xs font-bold text-slate-600 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />{' '}
                          {req.requested_by?.full_name}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium italic truncate max-w-[150px]">
                          <Building2 className="w-3 h-3 shrink-0" />{' '}
                          {req.department?.name}
                        </span>
                      </span>
                    </td>

                    {!isRequesterOnly && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                          {(
                            req.financials?.grand_total ??
                            (req.quantity || 0) * (req.estimated_unit_cost || 0)
                          ).toLocaleString()}{' '}
                          RWF
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-transparent ${getUrgencyStyle(req.urgency)}`}
                      >
                        {req.urgency === 'CRITICAL' && (
                          <AlertTriangle className="w-3 h-3" />
                        )}{' '}
                        {req.urgency}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <div
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(req.status)}`}
                      >
                        {req.status}
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1 transition-opacity">
                        {isHOD && req.status === 'PENDING' && (
                          <button
                            onClick={() => handleFormalize(req)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Process Request"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setRequestToView(req)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Justification"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* ADMIN ONLY APPROVAL ACTIONS - After HOD has formalized */}
                        {isAdmin && req.status === 'HOD_APPROVED' && (
                          <>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: req.id,
                                  status: 'APPROVED',
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Final Approval"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: req.id,
                                  status: 'REJECTED',
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {isAdmin && req.status === 'APPROVED' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: req.id,
                                status: 'FULFILLED',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as Fulfilled (Purchased)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100/50 bg-white/40 flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>Showing {filteredRequests.length} requests</span>
        </div>
      </div>
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setRequestMode(undefined);
          setRequestToFormalize(null);
        }}
        requestMode={requestMode}
        baseRequest={requestToFormalize}
      />
      <ViewRequestModal
        isOpen={!!requestToView}
        onClose={() => setRequestToView(null)}
        request={requestToView}
      />
      {selectedRequest && (
        <FormalizeRequestModal
          isOpen={isFormalizeModalOpen}
          onClose={() => {
            setIsFormalizeModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
    </div>
  );
};
