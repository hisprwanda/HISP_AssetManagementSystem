import { useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  Mail,
  Building2,
  ShieldCheck,
  Calendar,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Key,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Asset } from '../types/assets';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await api.post(`/users/${user?.id}/change-password`, {
        password,
      });
      return response.data;
    },
    onSuccess: () => {
      updateUser({ is_temporary_password: false });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setPasswordError(
        err.response?.data?.message || 'Failed to update password',
      );
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate(newPassword);
  };

  useEffect(() => {
    setHeaderTitle('My Account Profile');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const myAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter(
      (a) => a.assigned_to?.id === user?.id && a.status !== 'DISPOSED',
    );
  }, [assets, user]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-orange-400 rounded-[1.5rem] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
        <div className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[1.4rem] p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/5 to-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#ff8000] to-[#ffb366] flex items-center justify-center text-white text-3xl font-semibold shadow-xl border-4 border-white">
                {user.full_name?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 border-3 border-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  {user.full_name}
                </h1>
                <div className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-950 rounded-full text-[8px] font-semibold uppercase tracking-widest border border-orange-200 items-center gap-1 self-center sm:self-auto">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-slate-500 font-bold text-[10px] uppercase tracking-tight">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/50 rounded-lg border border-slate-200/30">
                  <Mail className="w-3 h-3 text-[#ff8000]" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/50 rounded-lg border border-slate-200/30">
                  <Building2 className="w-3 h-3 text-[#ff8000]" />
                  <span>{user.department?.name || 'Operations'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user.is_temporary_password && (
        <div className="relative overflow-hidden bg-orange-600 rounded-[1.5rem] p-6 shadow-xl shadow-orange-100 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-4 relative z-10 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Security Action Required
              </h3>
              <p className="text-xs font-medium text-orange-50 leading-relaxed max-w-md">
                You are currently using a system-generated temporary password.
                For your account's security, please create a permanent password
                now.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-6 py-3 bg-white text-orange-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-orange-50 transition-all shadow-lg active:scale-95 relative z-10 shrink-0"
          >
            Create Permanent Password
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-6 shadow-lg min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6 px-1 pt-1">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <div className="w-1 h-6 bg-[#ff8000] rounded-full" /> Personal
                  Asset Portfolio
                </h3>
                <p className="text-[9px] uppercase font-semibold tracking-[0.2em] text-slate-400 mt-0.5 ml-3.5">
                  Assigned Hardware Inventory
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100/50">
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Asset Detail
                    </th>
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Category
                    </th>
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Tag ID
                    </th>
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 text-right">
                      Condition
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {myAssets.length > 0 ? (
                    myAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="group hover:bg-orange-100/50 transition-all duration-300"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-white border border-orange-100 flex items-center justify-center shadow-sm group-hover:bg-orange-50 transition-all">
                              <Laptop className="w-4.5 h-4.5 text-orange-400 group-hover:text-[#ff8000]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-orange-950 tracking-tight leading-none mb-1 group-hover:text-[#ff8000] transition-colors">
                                {asset.name}
                              </p>
                              <p className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter italic">
                                Secured Assignment
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-bold text-orange-800 bg-orange-100/50 px-2.5 py-1 rounded-lg border border-orange-200/30">
                            {asset.category?.name || 'Equipment'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <code className="text-[10px] font-bold text-orange-600 font-mono tracking-tighter bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 group-hover:border-[#ff8000]/20 transition-colors">
                            {asset.tag_id || asset.serial_number}
                          </code>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-widest border shadow-sm bg-orange-50 text-orange-600 border-orange-100">
                            <span className="w-1 h-1 rounded-full bg-orange-500" />
                            {asset.status.replace('_', ' ')}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <AlertCircle className="w-8 h-8 text-orange-300 mb-3" />
                          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-500">
                            No assets registered
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-orange-50/50 backdrop-blur-xl border border-orange-100 rounded-[1.5rem] p-6 shadow-lg flex flex-col gap-6">
            <h3 className="text-[9px] font-semibold text-orange-400 uppercase tracking-[0.3em] px-1">
              Properties
            </h3>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200 group-hover:bg-[#ff8000] transition-all shadow-sm">
                  <UserIcon className="w-4.5 h-4.5 text-[#ff8000] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-orange-400 mb-0.5 leading-none">
                    Rank
                  </p>
                  <p className="text-xs font-semibold text-orange-950 tracking-tight uppercase group-hover:text-[#ff8000] transition-colors">
                    {user.role === 'HOD' &&
                    user.department?.name === 'Office of the CEO'
                      ? 'CEO'
                      : user.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200 group-hover:bg-orange-500 transition-all shadow-sm">
                  <Calendar className="w-4.5 h-4.5 text-orange-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-orange-400 mb-0.5 leading-none">
                    Joined
                  </p>
                  <p className="text-xs font-semibold text-orange-950 tracking-tight uppercase">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200 group-hover:bg-orange-500 transition-all shadow-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-orange-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-orange-400 mb-0.5 leading-none">
                    Status
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 tracking-tight uppercase">
                    Compliant
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => setIsPasswordModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">
                    Change Password
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Security Update
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-orange-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                    {passwordError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center gap-3 transition-all active:scale-95 mt-4"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Security...
                  </>
                ) : (
                  <>
                    Set Permanent Password <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
