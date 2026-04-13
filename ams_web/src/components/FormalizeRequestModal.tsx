import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  FileText,
  Send,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetRequest } from '../types/assets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface FormalizeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssetRequest;
}

export const FormalizeRequestModal = ({
  isOpen,
  onClose,
  request,
}: FormalizeRequestModalProps) => {
  const queryClient = useQueryClient();

  const [items, setItems] = useState<NonNullable<AssetRequest['items']>>([]);
  const [transportFees, setTransportFees] = useState(0);
  const [urgency, setUrgency] = useState<AssetRequest['urgency']>('MEDIUM');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (request && isOpen) {
      setItems(request.items || []);
      setUrgency(request.urgency || 'MEDIUM');
      setDescription(request.description || '');
      setTransportFees(request.financials?.transport_fees || 0);
    }
  }, [request, isOpen]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + (item.quantity || 0) * (item.unit_price || 0),
      0,
    );
  }, [items]);

  const grandTotal = itemsSubtotal + transportFees;

  const mutation = useMutation({
    mutationFn: async (payload: Partial<AssetRequest>) => {
      const response = await api.patch(
        `/assets-requests/${request.id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || 'Failed to formalize request.',
      );
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      { name: '', description: '', quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i: number) => i !== index));
  };

  const updateItem = (
    index: number,
    field: 'name' | 'description' | 'quantity' | 'unit_price',
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Please add at least one item.');
      return;
    }

    const finalTitle = request.title.startsWith('Formalized:')
      ? request.title
      : `Formalized: ${request.title}`;

    const payload: Partial<AssetRequest> = {
      ...request,
      title: finalTitle,
      status: 'HOD_APPROVED',
      urgency,
      description,
      items: items.map((i) => ({
        name: i.name,
        description: i.description,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
      financials: {
        subtotal: itemsSubtotal,
        transport_fees: transportFees,
        grand_total: grandTotal,
        cost_basis: 'MARKET_RESEARCH',
      },
    };

    mutation.mutate(payload);
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]">
        {success ? (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-orange-100 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8 text-[#ff8000]" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              Requisition Formalized!
            </h2>
            <p className="text-slate-500 font-medium px-8">
              The request has been updated and forwarded to Administration &
              Finance for verification.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-8 pt-8 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shadow-inner">
                  <FileText className="w-6 h-6 text-[#ff8000]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                    Formalize Requisition
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                    Staff:{' '}
                    <span className="text-slate-900 font-black">
                      {request.requested_by?.full_name}
                    </span>{' '}
                    • Dept:{' '}
                    <span className="text-[#ff8000] font-black">
                      {request.department?.name}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-8 py-4 space-y-8 custom-scrollbar"
            >
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#ff8000]" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff8000]">
                    Staff Description
                  </h4>
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                  "
                  {request.description || 'No additional description provided.'}
                  "
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Official Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff8000] text-white rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-[#e49f37] transition-all shadow-md shadow-orange-100"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map(
                    (
                      item: {
                        name: string;
                        quantity: number;
                        unit_price: number;
                      },
                      index: number,
                    ) => (
                      <div
                        key={index}
                        className="group relative bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:border-[#ff8000]/30 transition-all"
                      >
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                              Item Name
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                updateItem(index, 'name', e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none"
                              required
                            />
                          </div>
                          <div className="col-span-6 md:col-span-3">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                              Qty
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, 'quantity', e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none"
                              required
                            />
                          </div>
                          <div className="col-span-12 md:col-span-4">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                              Unit Price (RWF)
                            </label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(index, 'unit_price', e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="bg-orange-50 rounded-[2rem] p-8 text-slate-900 relative overflow-hidden border border-orange-100 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-center">
                  <div className="space-y-4 w-full md:w-auto">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Subtotal
                      </span>
                      <span className="text-xl font-black">
                        {itemsSubtotal.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-bold">
                          RWF
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Logistics
                      </span>
                      <input
                        type="number"
                        value={transportFees}
                        onChange={(e) =>
                          setTransportFees(Number(e.target.value))
                        }
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-800 w-24 outline-none focus:ring-2 focus:ring-[#ff8000]"
                      />
                    </div>
                  </div>
                  <div className="h-px md:h-12 w-full md:w-px bg-slate-200" />
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#ff8000] mb-1">
                      Total Estimated Investment
                    </p>
                    <p className="text-4xl font-black tracking-tight">
                      {grandTotal.toLocaleString()}{' '}
                      <span className="text-sm text-slate-400 font-bold">
                        RWF
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </form>

            <DialogFooter className="px-8 py-6 bg-slate-50 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="flex-[2] bg-[#ff8000] hover:bg-[#e49f37] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
              >
                {mutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Formalize & Forward to Admin
                  </>
                )}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
