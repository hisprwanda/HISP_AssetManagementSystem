import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  PackagePlus,
  CheckCircle2,
  Box,
  User as UserIcon,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetRequest, Asset, Category } from '../types/assets';

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
  const [selectedAssetIds, setSelectedAssetIds] = useState<
    Record<string, string>
  >({});
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

  const { data: allAssets } = useQuery<Asset[]>({
    queryKey: ['assets', 'in-stock'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data.filter((a: Asset) => a.status === 'IN_STOCK');
    },
    enabled: isOpen,
  });

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
      const assetIds = Object.values(selectedAssetIds).filter(Boolean);

      // Collect new assets to create
      const newAssets = flatItems
        .filter(
          (item) =>
            !selectedAssetIds[item.uniqueId] &&
            (assetSNs[item.uniqueId] || assetTags[item.uniqueId]),
        )
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
        assetIds,
        newAssets,
        receivedFromName,
      });

      const response = await api.patch(
        `/assets-requests/${request?.id}/deploy`,
        {
          asset_ids: assetIds,
          new_assets: newAssets,
          received_from_name: receivedFromName,
          condition_notes: conditionNotes,
          purchase_date: purchaseDate,
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
    // Reset asset when category changes
    setSelectedAssetIds((prev) => ({
      ...prev,
      [itemUniqueId]: '',
    }));
  };

  const handleAssetSelect = (itemIndex: string, assetId: string) => {
    setSelectedAssetIds((prev) => ({
      ...prev,
      [itemIndex]: assetId,
    }));
  };

  const isFormValid = useMemo(() => {
    if (!request || !request.items) return false;
    const totalRequested = request.items.reduce(
      (acc, item) => acc + (item.quantity || 1),
      0,
    );

    const matchedItems = flatItems.filter((item) => {
      const hasExisting = !!selectedAssetIds[item.uniqueId];
      const hasNew =
        !!selectedCategoryIds[item.uniqueId] &&
        (!!assetSNs[item.uniqueId] || !!assetTags[item.uniqueId]);
      return hasExisting || hasNew;
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
    selectedAssetIds,
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

      <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {isSuccess ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 border border-emerald-100 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Deployed!
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Assets have been assigned and the receipt is being generated.
            </p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#ff8000] flex items-center justify-center shadow-xl shadow-orange-200">
                  <PackagePlus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                    Automated Deployment
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                    Fulfilling Request:{' '}
                    <span className="text-[#ff8000] font-extrabold">
                      {request.title}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 bg-orange-50/50 rounded-3xl p-5 border border-orange-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8000] flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-[#ff8000] uppercase tracking-widest">
                      Requester Context
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-800 mb-0.5">
                    {request.requested_by?.full_name}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                    {request.department?.name}
                  </p>
                </div>

                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-2">
                      Handed Over By (Admin Signature)
                    </label>
                    <input
                      type="text"
                      value={receivedFromName}
                      onChange={(e) => setReceivedFromName(e.target.value)}
                      placeholder="Enter your name to sign..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-2">
                      Global Deployment Notes
                    </label>
                    <textarea
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      placeholder="Optional notes for this deployment..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-2">
                      Global Purchase Date
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Hardware Matching
                  </h4>
                  <span className="text-[10px] font-bold text-[#ff8000] bg-orange-50 px-2 py-1 rounded-full uppercase tracking-widest">
                    {
                      flatItems.filter(
                        (item) =>
                          !!selectedAssetIds[item.uniqueId] ||
                          (!!selectedCategoryIds[item.uniqueId] &&
                            (!!assetSNs[item.uniqueId] ||
                              !!assetTags[item.uniqueId])),
                      ).length
                    }{' '}
                    / {flatItems.length} Matched
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {flatItems.map((item) => (
                    <div
                      key={item.uniqueId}
                      className="group bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-6 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                        <Box className="w-6 h-6 text-slate-400 group-hover:text-[#ff8000]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {item.displayLabel}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          Requested Spec
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-300" />

                      <div className="flex-[4] flex flex-col gap-3 min-w-0">
                        <div className="flex gap-3">
                          <select
                            value={selectedCategoryIds[item.uniqueId] || ''}
                            onChange={(e) =>
                              handleCategorySelect(
                                item.uniqueId,
                                e.target.value,
                              )
                            }
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Select Category...</option>
                            {categories?.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={selectedAssetIds[item.uniqueId] || ''}
                            onChange={(e) =>
                              handleAssetSelect(item.uniqueId, e.target.value)
                            }
                            disabled={
                              !selectedCategoryIds[item.uniqueId] ||
                              !!assetSNs[item.uniqueId] ||
                              !!assetTags[item.uniqueId]
                            }
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Pick from Stock...</option>
                            {allAssets
                              ?.filter(
                                (a) =>
                                  a.category?.id ===
                                  selectedCategoryIds[item.uniqueId],
                              )
                              .filter(
                                (a) =>
                                  !Object.entries(selectedAssetIds).some(
                                    ([key, val]) =>
                                      key !== item.uniqueId && val === a.id,
                                  ),
                              )
                              .map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                  {asset.tag_id ? `[${asset.tag_id}] ` : ''}
                                  {asset.name} - S/N: {asset.serial_number}
                                </option>
                              ))}
                          </select>
                        </div>

                        {selectedCategoryIds[item.uniqueId] &&
                          !selectedAssetIds[item.uniqueId] && (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={assetSNs[item.uniqueId] || ''}
                                  onChange={(e) =>
                                    setAssetSNs((prev) => ({
                                      ...prev,
                                      [item.uniqueId]: e.target.value,
                                    }))
                                  }
                                  placeholder="Write Serial Number..."
                                  className="w-full bg-orange-50/30 border border-orange-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all"
                                />
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={assetTags[item.uniqueId] || ''}
                                  onChange={(e) =>
                                    setAssetTags((prev) => ({
                                      ...prev,
                                      [item.uniqueId]: e.target.value,
                                    }))
                                  }
                                  placeholder="Write Tag Number..."
                                  className="w-full bg-orange-50/30 border border-orange-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all"
                                />
                              </div>
                            </div>
                          )}
                      </div>

                      {(selectedAssetIds[item.uniqueId] ||
                        assetSNs[item.uniqueId] ||
                        assetTags[item.uniqueId]) && (
                        <div className="flex flex-col gap-1 w-32 items-end">
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">
                              {selectedAssetIds[item.uniqueId]
                                ? 'Linked'
                                : 'Ready'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => deployMutation.mutate()}
                disabled={deployMutation.isPending || !isFormValid}
                className="flex-[2] bg-[#ff8000] hover:bg-[#e67300] text-white py-4 rounded-2xl font-bold shadow-xl shadow-orange-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {deployMutation.isPending ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Complete Automated Handover
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
