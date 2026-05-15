import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DamageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  assetName: string;
  isLoading?: boolean;
}

export const DamageReportModal = ({
  isOpen,
  onClose,
  onConfirm,
  assetName,
  isLoading = false,
}: DamageReportModalProps) => {
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) return;
    onConfirm(remarks);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle
                className="w-4.5 h-4.5 text-rose-500"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                Report Asset Damage
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                {assetName}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Damage Remarks <span className="text-rose-400">*</span>
              </label>
              <textarea
                autoFocus
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe the condition of the asset..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 transition-all resize-none placeholder:text-slate-300"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !remarks.trim()}
                className="flex-[2] py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-semibold uppercase tracking-widest rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting
                  </span>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
