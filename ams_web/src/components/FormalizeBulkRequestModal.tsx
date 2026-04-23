import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FileText, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { AssetRequest } from '../types/assets';

interface FormalizeBulkRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchNumber: string;
  requests: AssetRequest[];
}

interface RequisitionItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export const FormalizeBulkRequestModal: React.FC<
  FormalizeBulkRequestModalProps
> = ({ isOpen, onClose, batchNumber, requests }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [transportFees, setTransportFees] = useState(0);
  const [urgency, setUrgency] = useState<string>('MEDIUM');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && requests.length > 0) {
      const initialItems = requests.map((req) => ({
        id: req.id,
        name: req.items?.[0]?.name || req.title,
        quantity: req.items?.[0]?.quantity || 1,
        unit_price: req.items?.[0]?.unit_price || 0,
      }));
      setItems(initialItems);
      setUrgency(requests[0].urgency);
      setDescription(requests[0].description);
    }
  }, [isOpen, requests]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  }, [items]);

  const grandTotal = itemsSubtotal + transportFees;

  const mutation = useMutation({
    mutationFn: async (payload: {
      items: RequisitionItem[];
      transport_fees: number;
      urgency: string;
      description: string;
    }) => {
      return await api.patch(
        `/assets-requests/bulk/${batchNumber}/formalize`,
        payload,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to formalize batch.');
    },
  });

  const updateItem = (
    index: number,
    field: keyof RequisitionItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      items,
      transport_fees: transportFees,
      urgency,
      description,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Requisition Officialized
            </h2>
            <p className="text-slate-500 font-medium">
              The official purchase requisition for batch {batchNumber} has been
              sent to Admin.
            </p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ff8000] flex items-center justify-center shadow-lg shadow-orange-200">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                    Official Purchase Requisition
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    Batch: {batchNumber} • {requests.length} Line Items
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
            >
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Requesting Dept
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {requests[0]?.department?.name}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Requester
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {requests[0]?.requested_by?.full_name}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-transparent border-none text-sm font-bold text-[#ff8000] focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                  Justification / Purpose
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Official justification for procurement..."
                />
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Goods/Services Requested
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Item Name
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                updateItem(idx, 'name', e.target.value)
                              }
                              className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'unit_price',
                                  Number(e.target.value),
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                            {(item.quantity * item.unit_price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Logistics/Fees
                    </span>
                    <input
                      type="number"
                      value={transportFees}
                      onChange={(e) => setTransportFees(Number(e.target.value))}
                      className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-[#ff8000] w-32"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Subtotal
                    </span>
                    <span className="text-xl font-bold">
                      {itemsSubtotal.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
                <div className="h-px md:h-16 w-full md:w-px bg-white/10" />
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-bold text-[#ff8000] uppercase tracking-widest mb-1">
                    Estimated Grand Total
                  </p>
                  <p className="text-4xl font-bold tracking-tighter">
                    {grandTotal.toLocaleString()} RWF
                  </p>
                </div>
              </div>
            </form>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="flex-[2] bg-[#ff8000] hover:bg-[#e49f37] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Official Requisition
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
