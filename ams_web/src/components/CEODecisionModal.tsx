import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
        className="absolute inset-0 bg-orange-950/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div
          className={`px-6 py-6 flex items-center gap-4 ${isApprove ? 'bg-orange-50' : 'bg-slate-50'}`}
        >
          <div
            className={`p-2 rounded-2xl ${isApprove ? 'bg-orange-100 text-[#ff8000]' : 'bg-slate-200 text-slate-600'}`}
          >
            {isApprove ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {isApprove ? 'Final Executive Approval' : 'Decline Asset Request'}
            </h3>
            <p
              className={`text-[11px] font-bold uppercase tracking-wider ${isApprove ? 'text-orange-600/70' : 'text-slate-500/70'}`}
            >
              CEO Decision Portal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
            {isApprove
              ? 'Executive Remarks (Optional)'
              : 'Reason for Rejection (Required)'}
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={
              isApprove
                ? 'e.g. Approved for urgent acquisition...'
                : 'Please provide a reason for declining this request...'
            }
            className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-200 outline-none transition-all placeholder:text-slate-300 font-medium resize-none shadow-inner"
          />

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(remarks)}
              disabled={isPending || (!isApprove && !remarks.trim())}
              className={`flex-[2] flex items-center justify-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest text-white rounded-xl shadow-lg transition-all transform active:scale-[0.98] ${
                isApprove
                  ? 'bg-[#ff8000] hover:bg-orange-700 shadow-orange-200'
                  : 'bg-orange-950 hover:bg-black shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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
