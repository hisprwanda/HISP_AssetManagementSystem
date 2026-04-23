import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { AssetRequest } from '../types/assets';

interface HODBulkReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchNumber: string;
  requests: AssetRequest[];
}

export const HODBulkReviewModal: React.FC<HODBulkReviewModalProps> = ({
  isOpen,
  onClose,
  batchNumber,
  requests,
}) => {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState('');
  const [vetoedIds, setVetoedIds] = useState<string[]>([]);

  const reviewMutation = useMutation({
    mutationFn: async (approve: boolean) => {
      return await api.patch(
        `/assets-requests/bulk/${batchNumber}/hod-review`,
        {
          approve,
          remarks,
          rejected_item_ids: approve ? vetoedIds : [],
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      onClose();
      setRemarks('');
      setVetoedIds([]);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      alert(err.response?.data?.message || 'Failed to review batch request.');
    },
  });

  if (!isOpen) return null;

  const requester = requests[0]?.requested_by;
  const date = requests[0]?.created_at;
  const justification =
    requests[0]?.logistics?.justification || requests[0]?.description;

  const toggleVeto = (id: string) => {
    setVetoedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                Batch Review
              </h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                Batch: {batchNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Requester Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Requester
              </p>
              <p className="text-sm font-bold text-slate-700">
                {requester?.full_name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Date Submitted
              </p>
              <p className="text-sm font-bold text-slate-700">
                {date ? new Date(date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Requester Justification
              </p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                "{justification}"
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Requested items
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                {requests.length} Items in Batch
              </span>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Line-Item Veto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className={`${vetoedIds.includes(req.id) ? 'bg-rose-50/50' : ''} transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-bold ${vetoedIds.includes(req.id) ? 'text-rose-600 line-through' : 'text-slate-700'}`}
                        >
                          {req.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleVeto(req.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            vetoedIds.includes(req.id)
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                          }`}
                        >
                          {vetoedIds.includes(req.id) ? 'REJECTED' : 'APPROVE'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              HOD Review Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your comments here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button
            onClick={() => reviewMutation.mutate(false)}
            disabled={reviewMutation.isPending}
            className="flex-1 py-4 rounded-2xl font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject Entire Batch
          </button>
          <button
            onClick={() => reviewMutation.mutate(true)}
            disabled={reviewMutation.isPending}
            className="flex-[1.5] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {reviewMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {vetoedIds.length > 0
                  ? `Approve with ${vetoedIds.length} Vetoes`
                  : 'Approve Full Batch'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
