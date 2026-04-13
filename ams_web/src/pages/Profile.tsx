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
  Edit,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Asset } from '../types/assets';

export const Profile = () => {
  const { user } = useAuth();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

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
    return assets.filter((a) => a.assigned_to?.id === user?.id);
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#ff8000] to-[#ffb366] flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white">
                {user.full_name?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 border-3 border-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {user.full_name}
                </h1>
                <div className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-950 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-200 items-center gap-1 self-center sm:self-auto">
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

          <button className="relative z-10 px-6 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 group">
            <Edit className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-6 shadow-lg min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6 px-1 pt-1">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <div className="w-1 h-6 bg-[#ff8000] rounded-full" /> Personal
                  Asset Portfolio
                </h3>
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 mt-0.5 ml-3.5">
                  Assigned Hardware Inventory
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100/50">
                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Asset Detail
                    </th>
                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Category
                    </th>
                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Tag ID
                    </th>
                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
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
                              <p className="text-sm font-black text-orange-950 tracking-tight leading-none mb-1 group-hover:text-[#ff8000] transition-colors">
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
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest border shadow-sm bg-orange-50 text-orange-600 border-orange-100">
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
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">
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
            <h3 className="text-[9px] font-black text-orange-400 uppercase tracking-[0.3em] px-1">
              Properties
            </h3>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200 group-hover:bg-[#ff8000] transition-all shadow-sm">
                  <UserIcon className="w-4.5 h-4.5 text-[#ff8000] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-0.5 leading-none">
                    Rank
                  </p>
                  <p className="text-xs font-black text-orange-950 tracking-tight uppercase group-hover:text-[#ff8000] transition-colors">
                    {user.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200 group-hover:bg-orange-500 transition-all shadow-sm">
                  <Calendar className="w-4.5 h-4.5 text-orange-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-0.5 leading-none">
                    Joined
                  </p>
                  <p className="text-xs font-black text-orange-950 tracking-tight uppercase">
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
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-0.5 leading-none">
                    Status
                  </p>
                  <p className="text-xs font-black text-emerald-600 tracking-tight uppercase">
                    Compliant
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
