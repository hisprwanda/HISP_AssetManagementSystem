import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface Department {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

export const EditDepartmentModal = ({
  isOpen,
  onClose,
  department,
}: EditDepartmentModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('Directorate');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (department) {
      setName(department.name);
      setType(department.type);
      setStatus(department.status || 'Active');
      setError(null);
    }
  }, [department]);

  const mutation = useMutation({
    mutationFn: async (updatedDept: {
      name: string;
      type: string;
      status: string;
    }) => {
      const response = await api.patch(
        `/departments/${department!.id}`,
        updatedDept,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
          : msg || 'Failed to update department. Please try again.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !type || !status) {
      setError('Please fill in all required fields.');
      return;
    }
    mutation.mutate({ name, type, status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 shadow-inner">
            <Building2 className="w-6 h-6 text-[#ff8000]" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
            Edit Directorate
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Update the details of this organizational unit.
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
              Directorate Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IT Department"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Directorate Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all appearance-none"
              required
            >
              <option value="Directorate">Directorate</option>
              <option value="Country Portfolio">Country Portfolio</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all appearance-none"
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
