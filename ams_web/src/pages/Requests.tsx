import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  FileText,
  FileUp,
  Banknote,
  Building2,
  User as UserIcon,
  X,
  Settings2,
  Send,
  UserCheck,
  FilePlus,
  PackageCheck,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AssetRequest, POData } from '../types/assets';

interface RequestUI extends AssetRequest {
  isBatch?: boolean;
  batchItems?: AssetRequest[];
}
import { CreateRequestModal } from '../components/CreateRequestModal';
import { ViewRequestModal } from '../components/ViewRequestModal';
import { CEODecisionModal } from '../components/CEODecisionModal';
import { FormalizeRequestModal } from '../components/FormalizeRequestModal';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import { Pagination } from '../components/Pagination';
import { HODBulkReviewModal } from '../components/HODBulkReviewModal';
import { FormalizeBulkRequestModal } from '../components/FormalizeBulkRequestModal';
import { UploadSignedPOModal } from '../components/UploadSignedPOModal';

export const Requests = () => {
  const { user: currentUser, isAdmin, isHOD, isStaff, isCEO } = useAuth();
  const isRequesterOnly = isStaff && !isAdmin && !isHOD;
  const queryClient = useQueryClient();
  const { openRequest, setHeaderTitle } = useOutletContext<{
    openRequest: () => void;
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle(
      isStaff && !isHOD ? 'My Asset Requests' : 'Procurement Requests',
    );
    return () => setHeaderTitle('');
  }, [setHeaderTitle, isStaff, isHOD]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [requestMode, setRequestMode] = useState<
    'SHARED' | 'INDIVIDUAL' | undefined
  >(undefined);
  const [requestToFormalize, setRequestToFormalize] =
    useState<AssetRequest | null>(null);
  const [isFormalizeModalOpen, setIsFormalizeModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>(
    'APPROVE',
  );
  const [requestForDecision, setRequestForDecision] =
    useState<AssetRequest | null>(null);
  const [requestToView, setRequestToView] = useState<AssetRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null,
  );
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [requestForPO, setRequestForPO] = useState<AssetRequest | null>(null);
  const [isBulkReviewOpen, setIsBulkReviewOpen] = useState(false);
  const [isBulkFormalizeOpen, setIsBulkFormalizeOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<{
    batchNumber: string;
    requests: AssetRequest[];
  } | null>(null);
  const [isUploadPOModalOpen, setIsUploadPOModalOpen] = useState(false);
  const [requestForUploadPO, setRequestForUploadPO] =
    useState<AssetRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: requests, isLoading } = useQuery<AssetRequest[]>({
    queryKey: ['assets-requests'],
    queryFn: async () => {
      const response = await api.get('/assets-requests');
      return response.data;
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, startDate, endDate]);
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      ceo_remarks,
      purchase_order,
    }: {
      id: string;
      status: string;
      ceo_remarks?: string;
      purchase_order?: POData;
    }) => {
      const payload: {
        status: string;
        ceo_remarks?: string;
        purchase_order?: POData;
      } = { status };
      if (ceo_remarks) payload.ceo_remarks = ceo_remarks;
      if (purchase_order) payload.purchase_order = purchase_order;
      return await api.patch(`/assets-requests/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
    },
  });
  const baseRequests = useMemo(() => {
    if (!requests) return [];
    let filtered = requests;

    if (isRequesterOnly) {
      filtered = filtered.filter((r) => r.requested_by?.id === currentUser?.id);
    } else {
      filtered = filtered.filter((r) => {
        // 1. CEO Privilege: See global review pipeline + own department if HOD
        if (isCEO) {
          const isCeoPipeline = [
            'CEO_REVIEW',
            'CEO_APPROVED',
            'REJECTED',
            'FULFILLED',
          ].includes(r.status);
          const isFromMyDept = r.department?.id === currentUser?.department?.id;
          return isCeoPipeline || (isHOD && isFromMyDept);
        }

        // 2. Admin Privilege: See everything formalized (passed HOD)
        if (isAdmin) {
          return r.status !== 'PENDING';
        }

        // 3. HOD Privilege: See department only
        if (isHOD) {
          return r.department?.id === currentUser?.department?.id;
        }

        return true;
      });
    }
    return filtered;
  }, [requests, isRequesterOnly, isHOD, isAdmin, isCEO, currentUser]);

  const filteredRequests = useMemo(() => {
    let filtered = baseRequests;

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

    if (startDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.created_at || 0);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.created_at || 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  }, [filterStatus, searchQuery, startDate, endDate, baseRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, startDate, endDate]);

  const displayRequests = useMemo(() => {
    const batches: Record<string, AssetRequest[]> = {};
    const singles: AssetRequest[] = [];

    filteredRequests.forEach((r) => {
      if (r.batch_number) {
        if (!batches[r.batch_number]) batches[r.batch_number] = [];
        batches[r.batch_number].push(r);
      } else {
        singles.push(r);
      }
    });

    const collapsedBatches = Object.values(batches).map((items) => {
      const template = items[0];
      return {
        ...template,
        isBatch: true,
        batchItems: items,
        title:
          items.length > 1
            ? `Multiple Items (${items.length})`
            : template.title,
      };
    });

    const combined = [...singles, ...collapsedBatches].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );

    const start = (currentPage - 1) * itemsPerPage;
    return combined.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginatedRequests = displayRequests;

  const pendingCount =
    baseRequests.filter((r) => r.status === 'PENDING').length || 0;
  const pendingValue =
    baseRequests
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => {
        const val =
          r.financials?.grand_total ??
          (r.quantity || 0) * (r.estimated_unit_cost || 0);
        return sum + val;
      }, 0) || 0;
  const fulfilledCount =
    baseRequests.filter((r) => r.status === 'FULFILLED').length || 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-slate-50 text-slate-400 border-slate-100';
      case 'PENDING_FORMALIZATION':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100 font-bold';
      case 'HOD_APPROVED':
      case 'APPROVED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'CEO_REVIEW':
        return 'bg-orange-50 text-[#ff8000] border-orange-200';
      case 'CEO_APPROVED':
        return 'bg-orange-50 text-orange-950 border-orange-200';
      case 'ORDERED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'FULFILLED':
        return 'bg-slate-50 text-slate-400 border-slate-200 italic';
      case 'REJECTED':
        return 'bg-orange-50 text-orange-600 border-orange-100 line-through';
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex-1" />
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isRequesterOnly && (
            <>
              {isHOD ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setRequestMode('INDIVIDUAL');
                      setIsCreateModalOpen(true);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group justify-center flex-1 sm:flex-none"
                  >
                    <UserIcon className="w-4 h-4" /> Request Individual Asset
                  </button>
                  <button
                    onClick={() => {
                      setRequestMode('SHARED');
                      setIsCreateModalOpen(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group justify-center flex-1 sm:flex-none"
                  >
                    <Building2 className="w-4 h-4" /> Request Shared Assets
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
        className={`grid grid-cols-1 ${isRequesterOnly ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 items-stretch`}
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3 h-full">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 leading-none mb-1">
              Pending Review
            </p>
            <p className="text-xl font-semibold text-slate-800 leading-none">
              {pendingCount}{' '}
              <span className="text-xs font-bold text-slate-400">requests</span>
            </p>
          </div>
        </div>

        {!isRequesterOnly && (
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-inner">
              <Banknote className="w-5 h-5 text-[#ff8000]" />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 leading-none mb-1">
                Est. Pending Budget
              </p>
              <p className="text-xl font-semibold text-slate-800 leading-none">
                {pendingValue.toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">RWF</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3 h-full">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 leading-none mb-1">
              Successfully Fulfilled
            </p>
            <p className="text-xl font-semibold text-slate-800 leading-none">
              {fulfilledCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                assets deployed
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-3 mb-6">
        <div className="bg-white/40 backdrop-blur-md border border-white p-2 rounded-xl shadow-sm flex items-center gap-2 max-w-sm">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap pl-1">
            Date Range:
          </span>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <span className="text-slate-300 mx-0.5">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="ml-1 p-1 hover:bg-rose-50 rounded-md transition-colors"
                title="Clear Dates"
              >
                <X className="w-3 h-3 text-rose-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, department, or requester..."
            className="w-full bg-transparent border-none pl-9 pr-4 py-1.5 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
            <Filter className="w-4 h-4 text-[#ff8000]" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Filters:
            </span>
          </div>
          <div className="flex gap-1">
            {[
              'ALL',
              'PENDING',
              'HOD_APPROVED',
              'APPROVED',
              'CEO_REVIEW',
              'CEO_APPROVED',
              'FULFILLED',
              'REJECTED',
            ].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${filterStatus === status ? 'bg-orange-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-orange-600'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Request Item
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Requested By
                </th>
                {!isRequesterOnly && (
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Total Est. Cost
                  </th>
                )}
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Urgency
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">
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
                paginatedRequests.map((req) => (
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
                          <Banknote className="w-3.5 h-3.5 text-[#ff8000]" />
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border border-transparent ${getUrgencyStyle(req.urgency)}`}
                      >
                        {req.urgency === 'CRITICAL' && (
                          <AlertTriangle className="w-3 h-3" />
                        )}{' '}
                        {req.urgency}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <div
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${getStatusStyle(req.status)}`}
                      >
                        {req.status}
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1 transition-opacity">
                        {isHOD && req.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              const r = req as RequestUI;
                              if (r.isBatch) {
                                setSelectedBatch({
                                  batchNumber: r.batch_number!,
                                  requests: r.batchItems!,
                                });
                                setIsBulkReviewOpen(true);
                              } else {
                                handleFormalize(req);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={
                              (req as RequestUI).isBatch
                                ? 'Review Batch'
                                : 'Process Request'
                            }
                          >
                            {(req as RequestUI).isBatch ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Settings2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {isHOD &&
                          req.status === 'PENDING_FORMALIZATION' &&
                          (req as RequestUI).isBatch && (
                            <button
                              onClick={() => {
                                const r = req as RequestUI;
                                setSelectedBatch({
                                  batchNumber: r.batch_number!,
                                  requests: r.batchItems!,
                                });
                                setIsBulkFormalizeOpen(true);
                              }}
                              className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Fill Official Requisition"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        <button
                          onClick={() => setRequestToView(req)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Justification"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {isAdmin && req.status === 'HOD_APPROVED' && (
                          <button
                            onClick={() => {
                              setRequestToFormalize(req);
                              setRequestMode('INDIVIDUAL');
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit & Verify Requisition"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && req.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => {
                                setRequestToFormalize(req);
                                setRequestMode('INDIVIDUAL');
                                setIsCreateModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit Requisition"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: req.id,
                                  status: 'CEO_REVIEW',
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Send for Executive Approval"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {isCEO && req.status === 'CEO_REVIEW' && (
                          <>
                            <button
                              onClick={() => {
                                setRequestForDecision(req);
                                setDecisionType('APPROVE');
                                setIsDecisionModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="CEO Final Approval"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setRequestForDecision(req);
                                setDecisionType('REJECT');
                                setIsDecisionModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isAdmin && req.status === 'CEO_APPROVED' && (
                          <>
                            {(req.requested_by?.role === 'CEO' ||
                              req.department?.name?.trim().toUpperCase() ===
                                'OFFICE OF THE CEO') &&
                            !req.verified_by_finance ? (
                              <button
                                onClick={() => {
                                  setRequestToFormalize(req);
                                  setRequestMode('INDIVIDUAL');
                                  setIsCreateModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                                title="Verify CEO Requisition"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setRequestForPO(req);
                                  setIsPOModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                                title="Generate Purchase Order"
                              >
                                <FilePlus className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {isAdmin && req.status === 'ORDERED' && (
                          <>
                            <button
                              onClick={() => {
                                setRequestForUploadPO(req);
                                setIsUploadPOModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                              title="Upload Scanned PO"
                            >
                              <FileUp className="w-4 h-4" />
                            </button>
                            {(req.purchase_order?.scanned_po_url ||
                              req.purchase_order?.is_digitally_signed) && (
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: req.id,
                                    status: 'FULFILLED',
                                  })
                                }
                                className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark as Fulfilled (Received)"
                              >
                                <PackageCheck className="w-4 h-4" />
                              </button>
                            )}
                          </>
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
          totalItems={filteredRequests.length}
        />
      </div>
      <UploadSignedPOModal
        isOpen={isUploadPOModalOpen}
        onClose={() => {
          setIsUploadPOModalOpen(false);
          setRequestForUploadPO(null);
        }}
        request={requestForUploadPO}
      />
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

      <CEODecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => {
          setIsDecisionModalOpen(false);
          setRequestForDecision(null);
        }}
        type={decisionType}
        isPending={updateStatusMutation.isPending}
        onConfirm={(remarks) => {
          if (requestForDecision) {
            updateStatusMutation.mutate({
              id: requestForDecision.id,
              status: decisionType === 'APPROVE' ? 'CEO_APPROVED' : 'REJECTED',
              ceo_remarks: remarks,
            });
            setIsDecisionModalOpen(false);
            setRequestForDecision(null);
          }
        }}
      />

      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => {
          setIsPOModalOpen(false);
          setRequestForPO(null);
        }}
        request={requestForPO}
        isPending={updateStatusMutation.isPending}
        onConfirm={(poData: POData) => {
          if (requestForPO) {
            updateStatusMutation.mutate(
              {
                id: requestForPO.id,
                status: 'ORDERED',
                purchase_order: poData,
              },
              {
                onSuccess: () => {
                  setIsPOModalOpen(false);
                  setRequestForPO(null);
                },
                onError: (error: unknown) => {
                  let message =
                    'Failed to issue Purchase Order. Please try again.';
                  if (axios.isAxiosError(error)) {
                    message = error.response?.data?.message || message;
                  }
                  alert(message);
                },
              },
            );
          }
        }}
      />

      {selectedBatch && (
        <HODBulkReviewModal
          isOpen={isBulkReviewOpen}
          onClose={() => {
            setIsBulkReviewOpen(false);
            setSelectedBatch(null);
          }}
          batchNumber={selectedBatch.batchNumber}
          requests={selectedBatch.requests}
        />
      )}

      {selectedBatch && (
        <FormalizeBulkRequestModal
          isOpen={isBulkFormalizeOpen}
          onClose={() => {
            setIsBulkFormalizeOpen(false);
            setSelectedBatch(null);
          }}
          batchNumber={selectedBatch.batchNumber}
          requests={selectedBatch.requests}
        />
      )}
    </div>
  );
};
