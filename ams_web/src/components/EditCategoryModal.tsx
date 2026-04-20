import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Save, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

import { Category } from '@/types/assets';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export const EditCategoryModal = ({
  isOpen,
  onClose,
  category,
}: EditCategoryModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [depreciationRate, setDepreciationRate] = useState('10');
  const [disposalRate, setDisposalRate] = useState('5');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDepreciationRate((category.depreciation_rate ?? 10).toString());
      setDisposalRate((category.disposal_rate ?? 5).toString());
      setError(null);
    }
  }, [category]);

  const mutation = useMutation({
    mutationFn: async (updatedCategory: {
      name: string;
      depreciation_rate: number;
      disposal_rate: number;
    }) => {
      const response = await api.patch(
        `/categories/${category!.id}`,
        updatedCategory,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
      setError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = axiosError.response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || 'Failed to update category. Please try again.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name) {
      setError('Please fill in the category name.');
      return;
    }
    mutation.mutate({
      name,
      depreciation_rate: parseFloat(depreciationRate),
      disposal_rate: parseFloat(disposalRate),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem]"
      >
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 shadow-inner">
            <Tag className="w-6 h-6 text-[#ff8000]" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
            Edit Category
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Modify category name or depreciation settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm font-bold animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptops"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Depr. Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={depreciationRate}
                onChange={(e) => setDepreciationRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Disposal Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={disposalRate}
                onChange={(e) => setDisposalRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-8 py-2.5 rounded-xl font-bold shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 group min-w-[140px]"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
