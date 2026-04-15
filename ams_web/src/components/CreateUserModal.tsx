import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Mail, User, Shield, Lock, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: { id: string; name: string } | null;
}

export const CreateUserModal = ({
  isOpen,
  onClose,
  department,
}: CreateUserModalProps) => {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (newUser: {
      full_name: string;
      email: string;
      password_hash: string;
      role: string;
      department_id: string;
    }) => {
      const dbUser = {
        ...newUser,
        department_id: department?.id,
      };
      const response = await api.post('/users', dbUser);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
      setFullName('');
      setEmail('');
      setPassword('');
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
          : msg || 'Failed to create user. Please check your details.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!department) {
      setError('No department selected. Please go back and try again.');
      return;
    }
    mutation.mutate({
      full_name: fullName,
      email,
      password_hash: password,
      role,
      department_id: department?.id || '',
    });
  };

  const isFinanceDept =
    department?.name === 'Admin and Finance' ||
    department?.name === 'Admin & Finance' ||
    department?.name === 'Admin and Finance Directorate';

  const roles = React.useMemo(
    () =>
      isFinanceDept
        ? [
            'Admin and Finance Director',
            'Finance Officer',
            'Operations Officer',
          ]
        : ['Staff', 'HOD'],
    [isFinanceDept],
  );

  React.useEffect(() => {
    if (isOpen) {
      setRole(roles[0]);
    }
  }, [isOpen, department?.name, roles]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 shadow-inner">
            <UserPlus className="w-6 h-6 text-[#ff8000]" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
            Provision Personnel
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Assign a new staff member to this directorate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 text-sm font-bold animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="enter full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Temporary Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="enter password (min. 6 characters)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all placeholder:text-slate-400"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              System Role *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] outline-none transition-all appearance-none"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 'HOD' ? '(Head of Department)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
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
              className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-8 py-2.5 rounded-xl font-bold shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 group min-w-[150px]"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Provision Access
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
