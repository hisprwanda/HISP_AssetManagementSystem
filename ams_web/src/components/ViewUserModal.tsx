import React from 'react';
import { X, Mail, Shield, Building2, Activity, Briefcase } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: { name: string; type: string };
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ViewUserModal: React.FC<ViewUserModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        <div className="px-8 py-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-600 font-black text-xl mb-4">
            {initials}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {user.full_name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                user.role === 'Admin and Finance'
                  ? 'bg-[#ff8000]/10 text-[#ff8000] border-[#ff8000]/20'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {user.role === 'Admin and Finance' && (
                <Shield className="w-3 h-3" />
              )}
              {user.role}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
              Personnel Information
            </h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Email Address
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Directorate / Unit
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {user.department?.name || 'HISP Rwanda'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Account status
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{' '}
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
              Workplace Settings
            </h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Primary Station
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {user.department?.type === 'Directorate'
                      ? 'Kigali Headquarters'
                      : user.department?.name || 'Kigali Headquarters'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            System Identifier: {user.id}
          </p>
        </div>
      </div>
    </>
  );
};
