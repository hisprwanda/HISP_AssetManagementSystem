import { useMemo, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Mail,
  Building2,
  ShieldCheck,
  Calendar,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Key,
  Phone,
  X,
  Lock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Asset } from '../types/assets';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const displayRole =
    user.role === 'HOD' && user.department?.name === 'Office of the CEO'
      ? 'CEO'
      : user.role?.replace(/_/g, ' ');

  const joinedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-[#ff8000]/5 via-transparent to-transparent" />
          <div
            className="absolute top-0 left-0 right-0 h-40 opacity-[0.03]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #ff8000 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-[#ff8000] to-[#ffb366] flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-orange-100 border-4 border-white">
                {user.full_name?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                  {user.full_name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-200">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>

              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100/50 text-orange-800 border border-orange-200/50 rounded-full text-[11px] font-bold tracking-wide uppercase">
                  {displayRole}
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-[#ff8000]" />
                  {user.email}
                </div>

                {user.phone_number && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-[#ff8000]" />
                    {user.phone_number}
                  </div>
                )}

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-[#ff8000]" />
                  {user.department?.name || 'Operations'}
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-[#ff8000]" />
                  Since {joinedDate}
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </div>
              </div>
            </div>

            {user.is_temporary_password && (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-orange-100"
              >
                <Key className="w-4 h-4" />
                Set Permanent Password
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#ff8000] rounded-full" />
              Personal Asset Portfolio
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-1 ml-4.5">
              Assigned Hardware Inventory
            </p>
          </div>
          <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
            {myAssets.length} {myAssets.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Asset Detail
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Tag ID
                </th>
                <th className="px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">
                  Condition
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myAssets.length > 0 ? (
                myAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="group hover:bg-orange-50/30 transition-colors duration-300"
                  >
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Laptop className="w-5 h-5 text-slate-400 group-hover:text-[#ff8000] transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1.5 group-hover:text-[#ff8000] transition-colors">
                            {asset.name}
                          </p>
                          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tight">
                            Secured Assignment
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/50 px-3 py-1 rounded-xl border border-slate-200/30">
                        {asset.category?.name || 'Equipment'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <code className="text-xs font-bold text-[#ff8000] font-mono bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                        {asset.tag_id || asset.serial_number}
                      </code>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {asset.status.replace('_', ' ')}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <AlertCircle className="w-10 h-10 text-slate-300 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                        No assets currently assigned
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {user.is_temporary_password
                      ? 'Set Permanent Password'
                      : 'Change Password'}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Secure your account with a strong password
                  </p>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-300" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ShieldCheck className="w-4 h-4 text-slate-300" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[11px] font-semibold text-red-600">
                      {passwordError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full py-4 bg-[#ff8000] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#e47200] transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Save New Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
