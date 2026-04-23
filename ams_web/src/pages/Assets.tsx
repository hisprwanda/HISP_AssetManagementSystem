import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  Search,
  Building2,
  Tag,
  AlertCircle,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  Eye,
  Printer,
  Server,
  Smartphone,
  Monitor,
  Car,
  Box,
  User as UserIcon,
  Activity,
  Archive,
  FileCheck,
  Upload,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { CreateCategoryModal } from '../components/CreateCategoryModal';
import { EditCategoryModal } from '../components/EditCategoryModal';
import { CreateAssetModal } from '@/components/CreateAssetModal';
import { EditAssetModal } from '../components/EditAssetModal';
import { ViewAssetModal } from '../components/ViewAssetModal';
import { ViewCategoryModal } from '../components/ViewCategoryModal';
import { DisposeAssetModal } from '../components/DisposeAssetModal';
import { AssetReceiptFormModal } from '../components/AssetReceiptFormModal';
import { UploadScannedFormModal } from '../components/UploadScannedFormModal';
import { Pagination } from '../components/Pagination';
import { BulkRequestModal } from '../components/BulkRequestModal';
import { BulkAssetReceiptModal } from '../components/BulkAssetReceiptModal';
import { ShoppingCart, PackagePlus } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

import {
  Category,
  Asset,
  AssetAssignment,
  User,
  RequestableItem,
} from '@/types/assets';

const getCategoryIcon = (categoryName?: string) => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('laptop') || name.includes('computer')) return Laptop;
  if (
    name.includes('printer') ||
    name.includes('copier') ||
    name.includes('office')
  )
    return Printer;
  if (
    name.includes('server') ||
    name.includes('network') ||
    name.includes('router')
  )
    return Server;
  if (
    name.includes('phone') ||
    name.includes('mobile') ||
    name.includes('tablet')
  )
    return Smartphone;
  if (name.includes('monitor') || name.includes('display')) return Monitor;
  if (
    name.includes('vehicle') ||
    name.includes('car') ||
    name.includes('transport')
  )
    return Car;
  return Box;
};

export const Assets = () => {
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();
  const { user: currentUser, isAdmin, isHOD, isStaff, isCEO } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryIdParam = searchParams.get('categoryId');

  useEffect(() => {
    setHeaderTitle('Asset Masterlist');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [catToView, setCatToView] = useState<Category | null>(null);
  const [catToEdit, setCatToEdit] = useState<Category | null>(null);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToView, setAssetToView] = useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assetToDispose, setAssetToDispose] = useState<Asset | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssetAssignment | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assignmentToUpload, setAssignmentToUpload] =
    useState<AssetAssignment | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isRequestableSidebarOpen, setIsRequestableSidebarOpen] =
    useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [cartItems, setCartItems] = useState<RequestableItem[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isBulkReceiptModalOpen, setIsBulkReceiptModalOpen] = useState(false);
  const itemsPerPage = 10;

  const { data: categories, isLoading: loadingCats } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  const { data: requestableItems, isLoading: loadingItems } = useQuery<
    RequestableItem[]
  >({
    queryKey: ['requestable-items', selectedCategory?.id],
    queryFn: async () => {
      const response = await api.get(
        `/categories/${selectedCategory?.id}/requestable-items`,
      );
      return response.data;
    },
    enabled: !!selectedCategory?.id,
  });

  const addItemMutation = useMutation({
    mutationFn: async (name: string) =>
      api.post(`/categories/${selectedCategory?.id}/requestable-items`, {
        name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['requestable-items', selectedCategory?.id],
      });
      setNewItemName('');
    },
    onError: (err: unknown) => {
      console.error('[RequestableItems] Failed to add item:', err);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) =>
      api.delete(`/requestable-items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['requestable-items', selectedCategory?.id],
      });
    },
    onError: (err: unknown) => {
      console.error('[RequestableItems] Failed to delete item:', err);
    },
  });

  useEffect(() => {
    if (categories && categoryIdParam) {
      const cat = categories.find((c) => c.id === categoryIdParam);
      if (cat) {
        setSelectedCategory(cat);
      }
    }
  }, [categories, categoryIdParam]);

  useEffect(() => {
    setCurrentPage(1);
    setAssetSearch('');
  }, [selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [assetSearch, searchQuery]);

  const debouncedSearch = useDebounce(assetSearch || searchQuery, 500);

  const { data: assets, isLoading: loadingAssets } = useQuery<Asset[]>({
    queryKey: ['assets', debouncedSearch],
    queryFn: async () => {
      const response = await api.get('/assets', {
        params: { search: debouncedSearch },
      });
      return response.data;
    },
  });

  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    let filtered = assets.filter((a) => a.status !== 'DISPOSED');

    if (isStaff) {
      filtered = filtered.filter((a) => a.assigned_to?.id === currentUser?.id);
    } else if (isHOD) {
      filtered = filtered.filter(
        (a) => a.department?.id === currentUser?.department?.id,
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category?.id === selectedCategory.id);
    }

    // Note: Global and local search are now handled by the backend via debouncedSearch

    return filtered;
    return filtered;
  }, [assets, selectedCategory, isStaff, isHOD, currentUser]);

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(start, start + itemsPerPage);
  }, [filteredAssets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const { counts: categoryAssetsCount, uncategorizedCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let uncategorized = 0;
    assets?.forEach((asset) => {
      if (asset.status === 'DISPOSED') return;
      if (asset.category?.id) {
        counts[asset.category.id] = (counts[asset.category.id] || 0) + 1;
      } else {
        uncategorized++;
      }
    });
    return { counts, uncategorizedCount: uncategorized };
  }, [assets]);
  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCatToDelete(null);
    },
  });
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setAssetToDelete(null);
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => await api.post('/assets/recalculate'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      alert(
        `Financials synchronized successfully! Updated ${data.data.updated} assets.`,
      );
    },
    onError: (err: unknown) => {
      console.error('Sync failed:', err);
      alert('Failed to sync financials. Please check connection.');
    },
  });

  const handleEditClick = (e: React.SyntheticEvent, cat: Category) => {
    e.stopPropagation();
    setCatToEdit(cat);
    setIsEditCatModalOpen(true);
  };

  const handleDeleteClick = (e: React.SyntheticEvent, cat: Category) => {
    e.stopPropagation();
    setCatToDelete(cat);
  };

  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-orange-50 text-orange-950 border-orange-200 font-semibold';
      case 'ASSIGNED':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      case 'BROKEN':
      case 'MISSING':
        return 'bg-white text-orange-500 border-orange-100 italic';
      case 'RETURN_PENDING':
        return 'bg-orange-100 text-orange-950 border-orange-300 font-bold';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  if (!selectedCategory && !searchQuery) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-slate-500 text-sm mt-0.5">
              Select a category to view and manage inventory.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 rounded-xl font-bold shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transform active:scale-95 transition-all flex items-center gap-2 group text-sm"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              New Category
            </button>
          )}
        </div>

        {loadingCats ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-[#ff8000]/30 border-t-[#ff8000] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories?.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat.name);

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(255,128,0,0.1)] hover:border-[#ff8000]/30 cursor-pointer transition-all group transform hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-[#ff8000] transition-colors shadow-inner shrink-0">
                      <CategoryIcon className="w-5 h-5 text-[#ff8000] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCatToView(cat);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => handleEditClick(e, cat)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, cat)}
                            className="p-1.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1 line-clamp-1 group-hover:text-[#ff8000] transition-colors">
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-2 mb-5">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-semibold tracking-widest text-slate-400">
                        Inventory
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {categoryAssetsCount[cat.id] || 0} Items
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-semibold tracking-widest text-slate-400">
                        Depr. Rate
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {cat.depreciation_rate ?? 0}% / yr
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-semibold tracking-widest text-slate-400">
                        Disposal
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {cat.disposal_rate ?? 0}% / yr
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#ff8000] uppercase tracking-widest">
                      Explore Collection &rarr;
                    </span>
                  </div>
                </div>
              );
            })}

            {uncategorizedCount > 0 && isAdmin && (
              <div
                onClick={() => setAssetSearch(' ')}
                className="bg-orange-50/50 backdrop-blur-xl border border-orange-200 border-dashed rounded-[1.5rem] p-5 shadow-sm hover:shadow-md cursor-pointer transition-all group flex flex-col h-full border-2"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center shadow-sm shrink-0">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-orange-800 mb-1">
                  Uncategorized Assets
                </h3>
                <p className="text-[10px] font-bold text-orange-600/70 mb-4 leading-relaxed line-clamp-2">
                  {uncategorizedCount} assets were found without a category.
                  Verify matching names.
                </p>
                <div className="mt-auto pt-4 border-t border-orange-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">
                    Fix Records &rarr;
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <CreateCategoryModal
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
        />
        <EditCategoryModal
          isOpen={isEditCatModalOpen}
          onClose={() => {
            setIsEditCatModalOpen(false);
            setCatToEdit(null);
          }}
          category={catToEdit}
        />
        <ViewCategoryModal
          isOpen={!!catToView}
          onClose={() => setCatToView(null)}
          category={catToView}
        />

        {catToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setCatToDelete(null)}
            />
            <div className="relative z-10 bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 mx-auto">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Delete Category?
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-6">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-700">
                  "{catToDelete.name}"
                </span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCatToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCatMutation.mutate(catToDelete.id)}
                  disabled={deleteCatMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {deleteCatMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  const HeaderIcon = getCategoryIcon(selectedCategory?.name);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#ff8000] transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />{' '}
          Back to Categories
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <HeaderIcon className="w-5 h-5 text-[#e49f37]" />
              <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                {selectedCategory?.name || 'Search Results'}
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              Viewing {filteredAssets.length} assets in this view.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
                className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm text-xs"
                title="Recalculate all depreciation"
              >
                {recalculateMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#ff8000] rounded-full animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                Sync Financials
              </button>
            )}

            {!isCEO && (
              <button
                onClick={() => setIsAssetModalOpen(true)}
                className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 rounded-xl font-bold shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transform active:scale-95 transition-all flex items-center gap-2 group text-sm"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />{' '}
                Assign Asset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            placeholder="Search by SN, name or user..."
            className="w-full bg-transparent border-none pl-10 pr-8 py-2 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
          {assetSearch && (
            <button
              onClick={() => setAssetSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 relative">
        <div className="flex-1 min-w-0 flex flex-col focus-within:z-10 bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col relative focus-within:z-10 overflow-hidden">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100/50">
                    {isAdmin && (
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={
                            paginatedAssets.length > 0 &&
                            paginatedAssets
                              .filter((a) => a.status === 'IN_STOCK')
                              .every((a) => selectedAssetIds.includes(a.id))
                          }
                          onChange={(e) => {
                            const inStockOnPage = paginatedAssets
                              .filter((a) => a.status === 'IN_STOCK')
                              .map((a) => a.id);
                            if (e.target.checked) {
                              setSelectedAssetIds([
                                ...new Set([
                                  ...selectedAssetIds,
                                  ...inStockOnPage,
                                ]),
                              ]);
                            } else {
                              setSelectedAssetIds(
                                selectedAssetIds.filter(
                                  (id) => !inStockOnPage.includes(id),
                                ),
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-[#ff8000] focus:ring-[#ff8000]"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      Asset Details
                    </th>
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      Tag / Serial
                    </th>
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      Classification
                    </th>
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      Depreciation Value
                    </th>
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      Disposal Value
                    </th>
                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {loadingAssets && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-400 font-bold"
                      >
                        Synchronizing...
                      </td>
                    </tr>
                  )}
                  {!loadingAssets && filteredAssets.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-slate-400 font-bold"
                      >
                        No assets found.
                      </td>
                    </tr>
                  )}

                  {!loadingAssets &&
                    paginatedAssets.map((asset) => {
                      const RowIcon = getCategoryIcon(asset.category?.name);

                      return (
                        <tr
                          key={asset.id}
                          className={`hover:bg-white/60 transition-colors group ${
                            selectedAssetIds.includes(asset.id)
                              ? 'bg-orange-50/50'
                              : ''
                          }`}
                        >
                          {isAdmin && (
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedAssetIds.includes(asset.id)}
                                disabled={asset.status !== 'IN_STOCK'}
                                onChange={() => {
                                  if (selectedAssetIds.includes(asset.id)) {
                                    setSelectedAssetIds(
                                      selectedAssetIds.filter(
                                        (id) => id !== asset.id,
                                      ),
                                    );
                                  } else {
                                    setSelectedAssetIds([
                                      ...selectedAssetIds,
                                      asset.id,
                                    ]);
                                  }
                                }}
                                className="rounded border-slate-300 text-[#ff8000] focus:ring-[#ff8000] disabled:opacity-20"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                                <RowIcon className="w-5 h-5 text-[#ff8000]" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-700 leading-none mb-1">
                                  {asset.name}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                  {asset.category?.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                                <Tag className="w-3 h-3" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider">
                                  {asset.tag_id || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-slate-400 transition-colors">
                                <Activity className="w-3 h-3" />
                                <span className="text-[9px] font-bold">
                                  {asset.serial_number}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span className="text-[9px] font-semibold uppercase tracking-tight">
                                  {asset.location || 'HQ Storage'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-orange-500 whitespace-nowrap">
                                <UserIcon className="w-3 h-3" />
                                <span className="text-[9px] font-semibold uppercase tracking-tight">
                                  {asset.assigned_to?.full_name || 'Unassigned'}
                                </span>
                              </div>
                              {asset.department?.name && (
                                <div className="text-[8px] font-medium text-slate-400 italic pl-4.5">
                                  {asset.department.name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[8px] border shrink-0 ${getStatusStyle(asset.status)}`}
                            >
                              {asset.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">
                                {Number(
                                  asset.current_value || 0,
                                ).toLocaleString()}{' '}
                                RWF
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                Cost:{' '}
                                {Number(
                                  asset.purchase_cost || 0,
                                ).toLocaleString()}{' '}
                                RWF
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-[#ff8000]">
                                {Number(
                                  asset.disposal_value || 0,
                                ).toLocaleString()}{' '}
                                RWF
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 group">
                                Est. Recovery
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssetToView(asset);
                                }}
                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssetToEdit(asset);
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Asset"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  {asset.status !== 'DISPOSED' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssetToDispose(asset);
                                      }}
                                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                      title="Dispose Asset"
                                    >
                                      <Archive className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssetToDelete(asset);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Asset"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {(isAdmin ||
                                asset.assigned_to?.id === currentUser?.id) &&
                                (() => {
                                  const latest =
                                    asset.assignment_history &&
                                    asset.assignment_history.length > 0
                                      ? [...asset.assignment_history].sort(
                                          (a, b) =>
                                            new Date(b.assigned_at).getTime() -
                                            new Date(a.assigned_at).getTime(),
                                        )[0]
                                      : null;

                                  const showFormIcon =
                                    (isAdmin &&
                                      !latest &&
                                      asset.status === 'ASSIGNED') ||
                                    (latest &&
                                      latest.form_status !== 'APPROVED');

                                  if (!showFormIcon) return null;

                                  const needsAction =
                                    latest &&
                                    ((isAdmin &&
                                      (latest.form_status === 'DRAFT' ||
                                        latest.form_status ===
                                          'PENDING_ADMIN_REVIEW' ||
                                        latest.form_status === 'REJECTED')) ||
                                      (!isAdmin &&
                                        (latest.form_status ===
                                          'PENDING_USER_SIGNATURE' ||
                                          latest.form_status === 'REJECTED')));

                                  const isUrgent =
                                    latest?.form_status === 'REJECTED';

                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!latest) {
                                          setAssignmentToUpload({
                                            id: 'legacy-' + asset.id,
                                            asset,
                                            user: asset.assigned_to as unknown as User,
                                          } as AssetAssignment);
                                          setIsUploadModalOpen(true);
                                        } else {
                                          setSelectedAssignment({
                                            ...latest,
                                            asset,
                                          });
                                          setIsReceiptModalOpen(true);
                                        }
                                      }}
                                      className={`p-2 rounded-lg transition-all ${
                                        needsAction
                                          ? isUrgent
                                            ? 'text-rose-600 bg-rose-50 animate-bounce ring-2 ring-rose-200'
                                            : 'text-orange-600 bg-orange-50 animate-pulse ring-2 ring-orange-200'
                                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                      }`}
                                      title={
                                        !latest
                                          ? 'Upload Scanned PDF (Paper Trail)'
                                          : latest.form_status === 'REJECTED'
                                            ? 'Form Rejected - Action Required'
                                            : 'Asset Receipt Form'
                                      }
                                    >
                                      {!latest ? (
                                        <Upload className="w-4 h-4" />
                                      ) : (
                                        <FileCheck className="w-4 h-4" />
                                      )}
                                    </button>
                                  );
                                })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAssets.length}
            />
          </div>
        </div>

        {selectedCategory && (
          <div
            className={`shrink-0 flex flex-col gap-3 transition-all duration-300 ease-in-out relative ${
              isRequestableSidebarOpen
                ? 'w-72 opacity-100'
                : 'w-0 opacity-0 overflow-hidden'
            }`}
          >
            <button
              onClick={() => setIsRequestableSidebarOpen(false)}
              className="absolute -left-3 top-10 w-6 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-all z-20 group"
              title="Collapse Sidebar"
            >
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-sm p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest">
                    Requestable Items
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-tight">
                    Items staff can select when requesting assets from this
                    category.
                  </p>
                </div>
                <span className="text-[9px] font-semibold text-[#ff8000] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                  {requestableItems?.length || 0} items
                </span>
              </div>

              {isAdmin && (
                <div className="flex gap-1.5 mb-3">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemName.trim()) {
                        e.preventDefault();
                        addItemMutation.mutate(newItemName.trim());
                      }
                    }}
                    placeholder="e.g. Laptop..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      if (newItemName.trim())
                        addItemMutation.mutate(newItemName.trim());
                    }}
                    disabled={!newItemName.trim() || addItemMutation.isPending}
                    className="bg-[#ff8000] hover:bg-[#e49f37] disabled:opacity-50 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shrink-0"
                  >
                    {addItemMutation.isPending ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Add
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-4 h-4 border-2 border-[#ff8000]/30 border-t-[#ff8000] rounded-full animate-spin" />
                  </div>
                ) : requestableItems && requestableItems.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {requestableItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 group hover:border-slate-200 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {!isAdmin && (
                            <button
                              onClick={() => {
                                if (!cartItems.find((c) => c.id === item.id)) {
                                  setCartItems([...cartItems, item]);
                                }
                              }}
                              disabled={
                                !!cartItems.find((c) => c.id === item.id)
                              }
                              className={`p-1.5 rounded-lg transition-all ${
                                cartItems.find((c) => c.id === item.id)
                                  ? 'bg-orange-100 text-orange-600 cursor-not-allowed'
                                  : 'text-[#ff8000] hover:bg-orange-50'
                              }`}
                              title={
                                cartItems.find((c) => c.id === item.id)
                                  ? 'In Cart'
                                  : 'Add to Cart'
                              }
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              className="text-slate-200 hover:text-rose-500 transition-colors ml-2 shrink-0 p-1.5"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[10px] text-slate-400 font-medium italic">
                      No items yet. Add one above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isAdmin && selectedCategory && !isRequestableSidebarOpen && (
          <button
            onClick={() => setIsRequestableSidebarOpen(true)}
            className="absolute right-0 top-10 w-6 h-12 bg-white border border-slate-200 border-r-0 rounded-l-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-all z-20 group"
            title="Expand Sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        )}
      </div>

      {/* Hardware Cart Bar (Admin) */}
      {isAdmin && selectedAssetIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-indigo-950 text-white rounded-full px-6 py-4 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <PackagePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none mb-1">
                  Hardware Handover Cart
                </p>
                <p className="text-sm font-bold leading-none">
                  {selectedAssetIds.length} Assets Selected
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedAssetIds([])}
                className="text-xs font-bold text-indigo-300 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsBulkReceiptModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                Assign Selected Assets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Request Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white rounded-full px-6 py-4 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff8000] flex items-center justify-center shadow-lg shadow-orange-500/20">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Request Cart
                </p>
                <p className="text-sm font-bold leading-none">
                  {cartItems.length} Items Selected
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCartItems([])}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Clear Cart
              </button>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95"
              >
                Review & Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkRequestModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        items={cartItems}
        onSuccess={() => setCartItems([])}
      />

      <BulkAssetReceiptModal
        isOpen={isBulkReceiptModalOpen}
        onClose={() => setIsBulkReceiptModalOpen(false)}
        selectedAssetIds={selectedAssetIds}
        onSuccess={() => {
          setSelectedAssetIds([]);
          setIsBulkReceiptModalOpen(false);
        }}
      />

      <CreateAssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        preselectedCategoryId={selectedCategory?.id}
      />
      <ViewAssetModal
        isOpen={!!assetToView}
        onClose={() => setAssetToView(null)}
        asset={assetToView}
      />
      <EditAssetModal
        isOpen={!!assetToEdit}
        onClose={() => setAssetToEdit(null)}
        asset={assetToEdit}
      />
      <DisposeAssetModal
        isOpen={!!assetToDispose}
        onClose={() => setAssetToDispose(null)}
        asset={assetToDispose}
      />
      <AssetReceiptFormModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
      />
      <UploadScannedFormModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        assignment={assignmentToUpload}
      />
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-orange-950/20 backdrop-blur-sm"
            onClick={() => setAssetToDelete(null)}
          />
          <div className="relative z-10 bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-5 mx-auto">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Delete Asset?
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-700">
                "{assetToDelete.name}"
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAssetToDelete(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAssetMutation.mutate(assetToDelete.id)}
                disabled={deleteAssetMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {deleteAssetMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
