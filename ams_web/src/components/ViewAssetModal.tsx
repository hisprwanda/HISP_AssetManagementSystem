import {
  X,
  Tag,
  ShieldCheck,
  Building2,
  User,
  MapPin,
  Activity,
} from 'lucide-react';
import { Asset } from '../pages/Assets';

interface ViewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export const ViewAssetModal: React.FC<ViewAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  if (!isOpen || !asset) return null;

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
          <div className="w-16 h-16 rounded-2xl bg-[#ff8000]/10 border border-[#ff8000]/20 flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-[#ff8000]" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {asset.name}
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            {asset.category?.name || 'Uncategorized'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Serial No
              </p>
              <p className="text-sm font-bold text-slate-700">
                {asset.serial_number}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Internal Tag
              </p>
              <p className="text-sm font-bold text-slate-700">
                {asset.tag_id || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Status
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                {asset.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#ff8000] mb-1 flex items-center gap-1">
                Current Book Value
              </p>
              <p className="text-lg font-black text-slate-800">
                {Number(asset.current_value || 0).toLocaleString()} RWF
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                Accumulated Depr.
              </p>
              <p className="text-lg font-bold text-slate-500">
                {Number(asset.accumulated_depreciation || 0).toLocaleString()}{' '}
                RWF
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
              Deployment
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Directorate
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {asset.department?.name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Assigned To
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {asset.assigned_to?.full_name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Location
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {asset.location || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {asset.description && (
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
                Description
              </h3>
              <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {asset.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
