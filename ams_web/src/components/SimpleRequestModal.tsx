import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Package,
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Category } from '../types/assets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface SimpleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleRequestModal = ({
  isOpen,
  onClose,
}: SimpleRequestModalProps) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      requested_by_id?: string;
      department_id?: string;
      urgency: string;
      status?: string;
      items: {
        name: string;
        description: string;
        quantity: number;
        unit_price: number;
      }[];
      financials: {
        subtotal: number;
        transport_fees: number;
        grand_total: number;
        cost_basis: string;
      };
      logistics: {
        destination: string;
        contact_name?: string;
        contact_phone: string;
      };
      description: string;
    }) => {
      const response = await api.post('/assets-requests', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        resetForm();
      }, 2000);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || 'Failed to submit request.',
      );
    },
  });

  const resetForm = () => {
    setCategoryId('');
    setItemName('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !itemName || !description) {
      setError('Please fill in all fields.');
      return;
    }

    const selectedCategory = categories?.find((c) => c.id === categoryId);

    const payload = {
      title: `Staff Request: ${itemName}`,
      requested_by_id: currentUser?.id,
      department_id: currentUser?.department?.id,
      urgency: 'MEDIUM',
      items: [
        {
          name: itemName,
          description: `Requested Category: ${selectedCategory?.name || 'Unknown'}`,
          quantity: 1,
          unit_price: 0, // To be filled by HOD
        },
      ],
      financials: {
        subtotal: 0,
        transport_fees: 0,
        grand_total: 0,
        cost_basis: 'ESTIMATE',
      },
      logistics: {
        destination: currentUser?.department?.name || 'Main Office',
        contact_name: currentUser?.full_name,
        contact_phone: 'N/A',
      },
      description: description,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem]">
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              Request Submitted!
            </h2>
            <p className="text-slate-500 font-medium px-8">
              Your request has been sent to your Head of Department for review
              and formal processing.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 shadow-inner">
                <ShoppingCart className="w-6 h-6 text-[#ff8000]" />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                Request New Asset
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Submit a simplified request. your HOD will be notified to fill
                in the official details.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Asset Category *
                </label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all appearance-none"
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  What item do you need? *
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Ergonomic Chair, MacBook Air M2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Why is this item needed? (Description) *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief explanation for this procurement..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all min-h-[100px] resize-none"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-3 sm:gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-[2] bg-[#ff8000] hover:bg-[#e49f37] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                >
                  {mutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Submit to HOD
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
