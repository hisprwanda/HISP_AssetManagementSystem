import { X, Building2, Activity, Briefcase, Users, Layout } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  type: string; // 'Directorate' or 'Country Portfolio'
  status: string; // 'Active' or 'Inactive'
}

interface ViewDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

export const ViewDepartmentModal = ({
  isOpen,
  onClose,
  department,
}: ViewDepartmentModalProps) => {
  if (!isOpen || !department) return null;

  const workplace =
    department.type === 'Directorate' ? 'Kigali Headquarters' : department.name;

  return (
    <>
      <div
        className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm z-40 transition-opacity flex items-center justify-center p-4 overflow-y-auto"
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
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4 shadow-sm">
            <Building2 className="w-8 h-8 text-[#ff8000]" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {department.name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              <Layout className="w-3 h-3" /> {department.type}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                department.status === 'Inactive'
                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-orange-50 text-orange-950 border-orange-200'
              }`}
            >
              <Activity className="w-3 h-3" /> {department.status}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Unit Profile */}
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
              Organizational Profile
            </h3>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Primary Workplace
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {workplace}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Assignment Policy
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    Dedicated Unit Personnel
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
              Operational Settings
            </h3>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-slate-500">
                  Asset Management
                </span>
                <span className="text-xs font-black text-slate-800 uppercase">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-slate-500">
                  Procurement Rights
                </span>
                <span className="text-xs font-black text-slate-400 uppercase">
                  Restricted
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            System ID: {department.id}
          </p>
        </div>
      </div>
    </>
  );
};
