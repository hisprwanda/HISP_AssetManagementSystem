import {
  X,
  FileText,
  Banknote,
  Building2,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

import { AssetRequest } from '../types/assets';

interface ViewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssetRequest | null;
}

export const ViewRequestModal = ({
  isOpen,
  onClose,
  request,
}: ViewRequestModalProps) => {
  const { user: currentUser, isAdmin, isHOD } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      status,
      remarks,
    }: {
      status: string;
      remarks?: string;
    }) => {
      if (!request) return;
      const response = await api.patch(`/assets-requests/${request.id}`, {
        status,
        ceo_remarks: remarks,
        verified_by_finance_id: currentUser?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update request.');
    },
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'HOD_APPROVED':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'FULFILLED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3.5 h-3.5" />;
      case 'HOD_APPROVED':
        return <Activity className="w-3.5 h-3.5" />;
      case 'APPROVED':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'FULFILLED':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'REJECTED':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'HIGH':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'LOW':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const isRequesterOnly = currentUser?.role === 'Staff' && !isAdmin && !isHOD;

  if (!isOpen || !request) return null;

  const steps = [
    { label: 'Initiated', status: 'completed' },
    {
      label: 'HOD Review',
      status:
        request.status === 'PENDING'
          ? 'current'
          : ['HOD_APPROVED', 'APPROVED', 'FULFILLED'].includes(request.status)
            ? 'completed'
            : 'pending',
    },
    {
      label: 'Central Approval',
      status:
        request.status === 'HOD_APPROVED'
          ? 'current'
          : ['APPROVED', 'FULFILLED'].includes(request.status)
            ? 'completed'
            : 'pending',
    },
    {
      label: 'Deployment',
      status:
        request.status === 'APPROVED'
          ? 'current'
          : request.status === 'FULFILLED'
            ? 'completed'
            : 'pending',
    },
  ];

  const grandTotal =
    request.financials?.grand_total ??
    (request.quantity || 0) * (request.estimated_unit_cost || 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        <div className="px-8 py-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 shadow-inner">
            <FileText className="w-7 h-7 text-blue-500" />
          </div>

          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-2">
            {request.title}
          </h2>

          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(request.status)}`}
            >
              {getStatusIcon(request.status)} {request.status}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getUrgencyStyle(request.urgency)}`}
            >
              {request.urgency === 'CRITICAL' && (
                <AlertTriangle className="w-3 h-3" />
              )}{' '}
              URGENCY: {request.urgency}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Approval Pipeline
            </h3>
            <div className="relative flex justify-between">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center relative z-10 flex-1"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                      step.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : step.status === 'current'
                          ? 'bg-white border-[#ff8000] text-[#ff8000] shadow-[0_0_12px_rgba(255,128,0,0.3)]'
                          : 'bg-white border-slate-200 text-slate-300'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[9px] font-black uppercase tracking-tighter ${
                      step.status === 'completed'
                        ? 'text-emerald-600'
                        : step.status === 'current'
                          ? 'text-[#ff8000]'
                          : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute top-3.5 left-[50%] w-full h-[2px] -z-10 ${
                        step.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {request.items && request.items.length > 0 ? (
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Requested
                Line Items
              </h3>
              <div className="space-y-3">
                {request.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {item.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      {!isRequesterOnly && (
                        <p className="text-xs font-black text-slate-700">
                          {(item.unit_price * item.quantity).toLocaleString()}{' '}
                          RWF
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        x{item.quantity} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !isRequesterOnly ? (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" /> Budget Calculation
              </h3>

              <div className="flex justify-between items-end mb-3 pb-3 border-b border-slate-200/60">
                <div>
                  <p className="text-xs font-bold text-slate-500">Unit Cost</p>
                  <p className="text-sm font-bold text-slate-800">
                    {(request.estimated_unit_cost || 0).toLocaleString()} RWF
                  </p>
                </div>
                <div className="text-center px-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Multiplier
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    x {request.quantity}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Subtotal
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {(
                    (request.quantity || 0) * (request.estimated_unit_cost || 0)
                  ).toLocaleString()}{' '}
                  RWF
                </span>
              </div>
            </div>
          ) : null}

          {!isRequesterOnly && (
            <div className="bg-[#1e293b] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Final Authorized Total</span>
                  <span className="text-emerald-400">Exp. Not to exceed</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-black text-emerald-400 tracking-tight leading-none">
                      {grandTotal.toLocaleString()}{' '}
                      <span className="text-xs text-white opacity-50 ml-1">
                        RWF
                      </span>
                    </p>
                    {request.financials?.transport_fees ? (
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider italic">
                        + {request.financials.transport_fees.toLocaleString()}{' '}
                        RWF Transfer Cost
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Basis:{' '}
                      {request.financials?.cost_basis || 'Standard Market'}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {request.financials?.budget_code_1 || 'General Ops'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Requisition Description
            </h3>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {request.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Requisition Details
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Requested By
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {request.requested_by?.full_name || 'Unknown User'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Official Directorate
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {request.department?.name || 'Unknown Directorate'}
                  </p>
                </div>
              </div>

              {request.logistics?.destination && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Ship-To Destination
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {request.logistics.destination}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Contact: {request.logistics.contact_name}{' '}
                      {request.logistics.contact_phone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Date Submitted
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {new Date(request.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex-1">
            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              Close
            </button>

            {request.status === 'HOD_APPROVED' &&
              (currentUser?.role === 'Admin and Finance Director' ||
                currentUser?.role === 'Finance Officer') && (
                <>
                  <button
                    onClick={() => mutation.mutate({ status: 'REJECTED' })}
                    disabled={mutation.isPending}
                    className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-bold rounded-xl flex items-center gap-2 transition-all"
                  >
                    {mutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsDown className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => mutation.mutate({ status: 'APPROVED' })}
                    disabled={mutation.isPending}
                    className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-100 transform active:scale-95 transition-all"
                  >
                    {mutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    Final Approval
                  </button>
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
};
