import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ShoppingCart, Send, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { RequestableItem } from '../types/assets';

interface BulkRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RequestableItem[];
  onSuccess: () => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const BulkRequestModal: React.FC<BulkRequestModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [justification, setJustification] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/assets-requests/bulk', {
        requestable_item_ids: items.map((i) => i.id),
        justification,
        user_id: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      onSuccess();
      onClose();
      setJustification('');
    },
    onError: (err: ApiError) => {
      console.error('[BulkRequestModal] Submission failed:', err);
      alert(err.response?.data?.message || 'Failed to submit bulk request.');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-orange-950/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff8000] flex items-center justify-center shadow-lg shadow-orange-200">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                Review Bulk Request
              </h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                {items.length} Items Selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
              Item Summary
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
              Shared Justification
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Please explain why you need these items..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all min-h-[120px] resize-none"
            />
            <div className="mt-3 flex items-start gap-2 text-slate-400 italic">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                This justification will be applied to all {items.length}{' '}
                requests in this batch.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => submitMutation.mutate()}
            disabled={!justification.trim() || submitMutation.isPending}
            className="flex-[2] bg-[#ff8000] hover:bg-[#e49f37] disabled:opacity-50 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {submitMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Batch Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
