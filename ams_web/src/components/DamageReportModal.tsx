import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 transition-all duration-300">
      <div
        className="absolute inset-0 transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        {/* Header/Banner */}
        <div className="h-3 bg-rose-500 w-full" />

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shadow-inner border border-rose-100/50">
              <AlertTriangle
                className="w-7 h-7 text-rose-500/80"
                strokeWidth={1.5}
              />
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-2 mb-8 text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              Report Asset Damage
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 inline-block px-2.5 py-1 rounded-lg">
                {assetName}
              </p>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                Reason Required *
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Damage Remarks
              </label>
              <textarea
                autoFocus
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe the condition of the asset (e.g., Cracked screen, missing keys...)"
                className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all resize-none placeholder:text-slate-300"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-2xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !remarks.trim()}
                className="flex-[2] py-4 bg-[#ff8000] text-white font-bold text-[10px] uppercase tracking-widest transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 rounded-2xl shadow-lg shadow-orange-100 hover:bg-[#e49f37]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Reporting
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
