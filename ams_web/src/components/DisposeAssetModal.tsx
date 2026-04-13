import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Calendar, Banknote, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { Asset } from '@/types/assets';

interface DisposeAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export const DisposeAssetModal = ({
  isOpen,
  onClose,
  asset,
}: DisposeAssetModalProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    disposal_date: new Date().toISOString().split('T')[0],
    disposal_value: '0',
    disposal_reason: '',
  });

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        disposal_date: formData.disposal_date,
        disposal_value: parseFloat(formData.disposal_value),
        disposal_reason: formData.disposal_reason,
      };

      await api.patch(`/assets/${asset.id}/dispose`, payload);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to dispose asset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-orange-100 bg-orange-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Officially Dispose Asset
            </h2>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mt-1">
              Final Retirement Workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 bg-orange-50 border-b border-orange-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{asset.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                SN: {asset.serial_number}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 p-8 space-y-6 overflow-y-auto"
        >
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-red-500">
              Disposal Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="date"
                value={formData.disposal_date}
                onChange={(e) =>
                  setFormData({ ...formData, disposal_date: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-red-500">
              Disposal Value / Recovery (RWF)
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="number"
                min="0"
                value={formData.disposal_value}
                onChange={(e) =>
                  setFormData({ ...formData, disposal_value: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Enter 0 if the asset is missing, destroyed, or stolen.
            </p>
          </div>

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-red-500">
              Disposal Reason
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                required
                rows={4}
                value={formData.disposal_reason}
                onChange={(e) =>
                  setFormData({ ...formData, disposal_reason: e.target.value })
                }
                placeholder="e.g., Damaged beyond repair, End of lifecycle sale, etc."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transform active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Confirm Disposal'
            )}
          </button>
        </div>
      </div>
    </>
  );
};
