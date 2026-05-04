import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CEODecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  type: 'APPROVE' | 'REJECT';
  isPending?: boolean;
}

export const CEODecisionModal: React.FC<CEODecisionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  isPending,
}) => {
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const isApprove = type === 'APPROVE';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-white">
        {/* Header Section */}
        <div
          className={`relative px-8 py-8 overflow-hidden ${isApprove ? 'bg-orange-50' : 'bg-rose-50'}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

          <div className="flex items-center gap-5 relative z-10">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ${
                isApprove
                  ? 'bg-[#ff8000] text-white shadow-orange-200'
                  : 'bg-rose-600 text-white shadow-rose-200'
              }`}
            >
              {isApprove ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <p
                className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${
                  isApprove ? 'text-orange-600' : 'text-rose-600'
                }`}
              >
                CEO Executive Portal
              </p>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {isApprove ? 'Executive Approval' : 'Decline Request'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-7">
          <div className="mb-6">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 px-1">
              {isApprove
                ? 'Decision Remarks (Optional)'
                : 'Reason for Rejection'}
            </label>
            <div className="relative group">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  isApprove
                    ? 'e.g. Approved for immediate deployment...'
                    : 'Provide detailed justification for declining this request...'
                }
                className="w-full h-36 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-slate-50 focus:border-slate-200 outline-none transition-all placeholder:text-slate-300 resize-none shadow-inner leading-relaxed"
              />
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
                {isApprove ? (
                  <CheckCircle2 className="w-5 h-5 text-orange-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(remarks)}
              disabled={isPending || (!isApprove && !remarks.trim())}
              className={`flex-[2] flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-widest text-white rounded-xl shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed ${
                isApprove
                  ? 'bg-gradient-to-r from-[#ff8000] to-orange-500 hover:shadow-orange-200'
                  : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:shadow-rose-200'
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm {isApprove ? 'Approval' : 'Rejection'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
