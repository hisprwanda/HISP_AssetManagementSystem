import {
  X,
  Tag,
  ShieldCheck,
  Building2,
  User,
  MapPin,
  Activity,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Asset } from '@/types/assets';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ConfirmActionModal } from './ConfirmActionModal';

interface ViewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export const ViewAssetModal = ({
  isOpen,
  onClose,
  asset: initialAsset,
}: ViewAssetModalProps) => {
  const { user, isAdmin, isCEO } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(initialAsset);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);

  // Sync state when initialAsset changes
  if (initialAsset?.id !== asset?.id) {
    setAsset(initialAsset);
  }
  if (!isOpen || !asset) return null;

  const calculateMonths = () => {
    if (!asset.purchase_date) return null;
    const start = new Date(asset.purchase_date);
    const end =
      asset.status === 'DISPOSED' && asset.disposal_date
        ? new Date(asset.disposal_date)
        : new Date();

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  };

  const assetAgeMonths = calculateMonths();

  return (
    <>
      <div
        className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm z-40 transition-opacity"
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
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  asset.status === 'ASSIGNED' || asset.status === 'IN_STOCK'
                    ? 'bg-orange-50 text-orange-950 border border-orange-200'
                    : asset.status === 'BROKEN'
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : asset.status === 'MISSING' ||
                          asset.status === 'DISPOSED'
                        ? 'bg-white text-orange-400 border border-orange-100 italic'
                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                }`}
              >
                {asset.status === 'ASSIGNED'
                  ? 'Assigned'
                  : asset.status === 'BROKEN'
                    ? 'Broken'
                    : asset.status === 'MISSING'
                      ? 'Missing'
                      : asset.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Purchase Date
              </p>
              <p className="text-sm font-bold text-slate-700">
                {asset.purchase_date
                  ? new Date(asset.purchase_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> System Age
              </p>
              <p className="text-sm font-bold text-slate-700">
                {assetAgeMonths !== null
                  ? `${assetAgeMonths} ${assetAgeMonths === 1 ? 'Month' : 'Months'}`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {(isAdmin || isCEO) && (
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
          )}

          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
              Deployment
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {asset.status === 'DISPOSED'
                      ? 'Last Directorate'
                      : 'Directorate'}
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
                    {asset.status === 'DISPOSED'
                      ? 'Previously Assigned To'
                      : 'Assigned To'}
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {asset.assigned_to?.full_name ||
                      (asset.assignment_history &&
                      asset.assignment_history.length > 0
                        ? [...asset.assignment_history].sort(
                            (a, b) =>
                              new Date(b.assigned_at).getTime() -
                              new Date(a.assigned_at).getTime(),
                          )[0].user?.full_name
                        : 'Unassigned')}
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

          {asset.status === 'DISPOSED' && (
            <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 space-y-3">
              <h3 className="text-xs font-black text-red-600 uppercase tracking-widest border-b border-red-100 pb-2 flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Disposal Registry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Disposal Date
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {asset.disposal_date
                      ? new Date(asset.disposal_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Recovery Value
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {Number(asset.disposal_value || 0).toLocaleString()} RWF
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Reason
                  </p>
                  <p className="text-xs font-medium text-slate-600 italic">
                    "{asset.disposal_reason || 'No reason provided'}"
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {asset.status === 'ASSIGNED' &&
            user &&
            (user.id === asset.assigned_to?.id ||
              user.role.toUpperCase().includes('HOD') ||
              user.role.toUpperCase().includes('ADMIN')) && (
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={() => setIsReturnConfirmOpen(true)}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-orange-100 text-[#ff8000] rounded-xl text-sm font-black uppercase tracking-widest hover:bg-orange-50 hover:border-orange-200 transition-all disabled:opacity-50 shadow-sm"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`}
                  />
                  {isSubmitting ? 'Processing...' : 'Submit for Return'}
                </button>
              </div>
            )}
        </div>
      </div>

      <ConfirmActionModal
        isOpen={isReturnConfirmOpen}
        onClose={() => setIsReturnConfirmOpen(false)}
        onConfirm={async () => {
          setIsSubmitting(true);
          try {
            const response = await api.patch(
              `/assets/${asset.id}/initiate-return`,
              { userId: user?.id },
            );
            setAsset(response.data);
            toast.success('Return process initiated successfully.');
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? (error as { response?: { data?: { message?: string } } })
                    .response?.data?.message || error.message
                : 'Failed to initiate return.';
            toast.error(message);
          } finally {
            setIsSubmitting(false);
          }
        }}
        title="Initiate Asset Return"
        message={`Hello ${user?.full_name?.split(' ')[0] || 'User'}, are you sure you want to initiate the return process for this asset? Administration and your HOD will be notified immediately.`}
        confirmText="Initiate Return"
        variant="warning"
        isLoading={isSubmitting}
      />
    </>
  );
};
