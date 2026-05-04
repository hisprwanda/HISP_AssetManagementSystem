import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PackagePlus,
  CheckCircle2,
  Box,
  User as UserIcon,
  Activity,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetRequest, Category } from '../types/assets';

interface DeployRequestAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssetRequest | null;
  onSuccess: () => void;
}

export const DeployRequestAssetsModal: React.FC<
  DeployRequestAssetsModalProps
> = ({ isOpen, onClose, request, onSuccess }) => {
  const queryClient = useQueryClient();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<
    Record<string, string>
  >({});
  const [assetSNs, setAssetSNs] = useState<Record<string, string>>({});
  const [assetTags, setAssetTags] = useState<Record<string, string>>({});
  const [receivedFromName, setReceivedFromName] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const flatItems = useMemo(() => {
    if (!request) return [];
    return (request.items || []).flatMap((item, idx) =>
      Array.from({ length: item.quantity || 1 }).map((_, qIdx) => ({
        ...item,
        uniqueId: `${idx}-${qIdx}`,
        displayLabel: `${item.name} (Unit ${qIdx + 1}/${item.quantity || 1})`,
      })),
    );
  }, [request]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    enabled: isOpen,
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      console.log('[DeployModal] Initiating deployment...');

      // Collect new assets to create
      const newAssets = flatItems
        .filter((item) => assetSNs[item.uniqueId] || assetTags[item.uniqueId])
        .map((item) => {
          const categoryId = selectedCategoryIds[item.uniqueId];
          if (!categoryId) {
            console.warn(
              `[DeployModal] Item ${item.uniqueId} is missing category ID!`,
            );
          }
          return {
            category_id: categoryId,
            serial_number: assetSNs[item.uniqueId] || '',
            tag_id: assetTags[item.uniqueId] || '',
            name: item.name,
          };
        });

      console.log('[DeployModal] Payload:', {
        newAssets,
        receivedFromName,
      });

      const response = await api.patch(
        `/assets-requests/${request?.id}/deploy`,
        {
          asset_ids: [],
          new_assets: newAssets,
          received_from_name: receivedFromName,
          condition_notes: conditionNotes,
          purchase_date: purchaseDate,
          warranty_expiry_date: warrantyExpiry || undefined,
        },
      );

      console.log('[DeployModal] Response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 2000);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      console.error('Deployment failed:', error);
      alert(
        error.response?.data?.message ||
          'Failed to complete automated deployment. Please try again.',
      );
    },
  });

  const handleCategorySelect = (itemUniqueId: string, categoryId: string) => {
    setSelectedCategoryIds((prev) => ({
      ...prev,
      [itemUniqueId]: categoryId,
    }));
  };

  const isFormValid = useMemo(() => {
    if (!request || !request.items) return false;
    const totalRequested = request.items.reduce(
      (acc, item) => acc + (item.quantity || 1),
      0,
    );

    const matchedItems = flatItems.filter((item) => {
      return (
        !!selectedCategoryIds[item.uniqueId] &&
        (!!assetSNs[item.uniqueId] || !!assetTags[item.uniqueId])
      );
    });

    const isValid =
      matchedItems.length === totalRequested &&
      receivedFromName.trim().length > 0;

    console.log('[DeployModal] Validation:', {
      totalRequested,
      matchedCount: matchedItems.length,
      receivedFromNameLength: receivedFromName.trim().length,
      isValid,
    });

    return isValid;
  }, [
    request,
    flatItems,
    selectedCategoryIds,
    assetSNs,
    assetTags,
    receivedFromName,
  ]);

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className={`relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col ${isSuccess ? 'max-w-sm w-full' : 'w-full max-w-5xl max-h-[92vh]'}`}
      >
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
              Handover Complete
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              The registry has been updated successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#ff8000] flex items-center justify-center shadow-lg shadow-orange-100 transform rotate-3">
                  <PackagePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
                    Automated Deployment
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Fulfilling:{' '}
                    <span className="text-[#ff8000]">{request.title}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Requester
                      </p>
                      <h3 className="text-base font-bold text-slate-800">
                        {request.requested_by?.full_name}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Directorate
                      </p>
                      <p className="text-sm font-semibold text-slate-600">
                        {request.department?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Asset Category
                      </p>
                      <p className="text-sm font-semibold text-slate-600">
                        Standard Issue
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-8 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">
                        Handed Over By (Admin Name)
                      </label>
                      <input
                        type="text"
                        value={receivedFromName}
                        onChange={(e) => setReceivedFromName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#ff8000] focus:ring-2 focus:ring-orange-500/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">
                        Deployment Notes
                      </label>
                      <textarea
                        value={conditionNotes}
                        onChange={(e) => setConditionNotes(e.target.value)}
                        placeholder="Add any specific notes for this deployment..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#ff8000] focus:ring-2 focus:ring-orange-500/10 outline-none transition-all h-24 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#ff8000] outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">
                          Warranty Expiry
                        </label>
                        <input
                          type="date"
                          value={warrantyExpiry}
                          onChange={(e) => setWarrantyExpiry(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#ff8000] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Hardware Matching Registry
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff8000] transition-all duration-500"
                        style={{
                          width: `${(flatItems.filter((i) => selectedCategoryIds[i.uniqueId] && (assetSNs[i.uniqueId] || assetTags[i.uniqueId])).length / flatItems.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-[#ff8000] bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      {
                        flatItems.filter(
                          (i) =>
                            selectedCategoryIds[i.uniqueId] &&
                            (assetSNs[i.uniqueId] || assetTags[i.uniqueId]),
                        ).length
                      }{' '}
                      / {flatItems.length} Matched
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {flatItems.map((item) => (
                    <div
                      key={item.uniqueId}
                      className={`bg-white border rounded-2xl p-5 flex items-start gap-6 transition-all ${
                        assetSNs[item.uniqueId] || assetTags[item.uniqueId]
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-100'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          assetSNs[item.uniqueId] || assetTags[item.uniqueId]
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {assetSNs[item.uniqueId] || assetTags[item.uniqueId] ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Box className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-bold text-slate-800 mb-1">
                              {item.displayLabel}
                            </h5>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              ID: {item.uniqueId}
                            </span>
                          </div>

                          <select
                            value={selectedCategoryIds[item.uniqueId] || ''}
                            onChange={(e) =>
                              handleCategorySelect(
                                item.uniqueId,
                                e.target.value,
                              )
                            }
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-600 outline-none cursor-pointer"
                          >
                            <option value="">Select Category...</option>
                            {categories?.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedCategoryIds[item.uniqueId] && (
                          <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
                            <input
                              type="text"
                              value={assetSNs[item.uniqueId] || ''}
                              onChange={(e) =>
                                setAssetSNs((prev) => ({
                                  ...prev,
                                  [item.uniqueId]: e.target.value,
                                }))
                              }
                              placeholder="Serial Number"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:border-[#ff8000] outline-none"
                            />
                            <input
                              type="text"
                              value={assetTags[item.uniqueId] || ''}
                              onChange={(e) =>
                                setAssetTags((prev) => ({
                                  ...prev,
                                  [item.uniqueId]: e.target.value,
                                }))
                              }
                              placeholder="Asset Tag ID"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:border-[#ff8000] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-wider text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => deployMutation.mutate()}
                disabled={deployMutation.isPending || !isFormValid}
                className="flex-1 bg-[#ff8000] hover:bg-[#e67300] disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
              >
                {deployMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span className="text-sm uppercase tracking-wider">
                      Complete Handover
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
