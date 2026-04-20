import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useSearchParams,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import {
  Search,
  Archive,
  Eye,
  Calendar,
  FileText,
  TrendingDown,
  Box,
  Laptop,
  Printer,
  Server,
  Smartphone,
  Monitor,
  Car,
  ArrowLeft,
  Trash2,
  History,
} from 'lucide-react';
import { api } from '../lib/api';
import { ViewAssetModal } from '../components/ViewAssetModal';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { Asset, Category } from '@/types/assets';

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

const getResolvedCustodian = (asset: Asset) => {
  if (asset.assigned_to) return asset.assigned_to.full_name;
  if (!asset.assignment_history || asset.assignment_history.length === 0)
    return null;

  const sortedHistory = [...asset.assignment_history].sort(
    (a, b) =>
      new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
  );

  return sortedHistory[0].user?.full_name;
};

export const DisposalTrail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [assetToView, setAssetToView] = useState<Asset | null>(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    const title = selectedCategory
      ? `${selectedCategory.name} Disposal Logs`
      : 'Disposal Trail';
    setHeaderTitle(title);
    return () => setHeaderTitle('');
  }, [setHeaderTitle, selectedCategory]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  useEffect(() => {
    if (categories && categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) {
        setSelectedCategory(cat);
      }
    }
  }, [categories, categoryId]);

  const handleBackToOverview = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      navigate('/disposal-logs');
    } else {
      navigate('/audit-trail');
    }
  };

  const disposedAssets = useMemo(() => {
    if (!assets) return [];
    let filtered = assets.filter((a) => a.status === 'DISPOSED');

    if (startDate) {
      filtered = filtered.filter((a) => {
        const date = new Date(a.disposal_date || a.updated_at || 0);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((a) => {
        const date = new Date(a.disposal_date || a.updated_at || 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category?.id === selectedCategory.id);
    }
    return filtered;
  }, [assets, selectedCategory, startDate, endDate]);

  const allDisposedAssets = useMemo(() => {
    if (!assets) return [];
    let filtered = assets.filter((a) => a.status === 'DISPOSED');

    if (startDate) {
      filtered = filtered.filter((a) => {
        const date = new Date(a.disposal_date || a.created_at || 0);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((a) => {
        const date = new Date(a.disposal_date || a.created_at || 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    return filtered;
  }, [assets, startDate, endDate]);

  const categoryMetrics = useMemo(() => {
    if (!categories || !allDisposedAssets) return [];
    return categories
      .map((cat) => {
        const catAssets = allDisposedAssets.filter(
          (a) => a.category?.id === cat.id,
        );
        const recovery = catAssets.reduce(
          (sum, a) => sum + (Number(a.disposal_value) || 0),
          0,
        );
        return {
          ...cat,
          count: catAssets.length,
          recovery,
        };
      })
      .filter((c) => c.count > 0);
  }, [categories, allDisposedAssets]);

  const metrics = useMemo(() => {
    if (disposedAssets.length === 0)
      return { avgLifecycle: 0, totalRecovery: 0, totalLoss: 0 };

    let totalYears = 0;
    let validDateCount = 0;
    let totalRecovery = 0;
    let totalPurchase = 0;

    disposedAssets.forEach((a) => {
      totalRecovery += Number(a.disposal_value) || 0;
      totalPurchase += Number(a.purchase_cost) || 0;

      if (a.purchase_date && a.disposal_date) {
        const start = new Date(a.purchase_date);
        const end = new Date(a.disposal_date);
        const diffYears =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (diffYears > 0) {
          totalYears += diffYears;
          validDateCount++;
        }
      }
    });

    return {
      avgLifecycle:
        validDateCount > 0 ? (totalYears / validDateCount).toFixed(1) : 'N/A',
      totalRecovery,
      totalLoss: Math.max(0, totalPurchase - totalRecovery),
    };
  }, [disposedAssets]);

  const handleExportLogs = () => {
    if (!disposedAssets.length) return;

    if (!startDate && !endDate && !showExportConfirm) {
      setShowExportConfirm(true);
      return;
    }

    const headers = [
      'Asset Name',
      'Serial Number',
      'Tag ID',
      'Category',
      'Retired Date',
      'Recovery Value (RWF)',
      'Reason',
      'Previous Custodian',
      'Directorate',
    ];

    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = str.toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = disposedAssets.map((asset) => [
      escapeCSV(asset.name),
      escapeCSV(asset.serial_number),
      escapeCSV(asset.tag_id || 'N/A'),
      escapeCSV(asset.category?.name || ''),
      escapeCSV(
        asset.disposal_date
          ? new Date(asset.disposal_date).toLocaleDateString()
          : 'N/A',
      ),
      escapeCSV(asset.disposal_value || 0),
      escapeCSV(asset.disposal_reason || ''),
      escapeCSV(getResolvedCustodian(asset) || 'Unassigned'),
      escapeCSV(asset.department?.name || 'N/A'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = selectedCategory
      ? `disposal_logs_${selectedCategory.name.toLowerCase().replace(/\s+/g, '_')}_${dateStr}.csv`
      : `all_disposal_logs_${dateStr}.csv`;

    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return disposedAssets;

    return disposedAssets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.serial_number?.toLowerCase().includes(q) ||
        a.tag_id?.toLowerCase().includes(q) ||
        a.disposal_reason?.toLowerCase().includes(q) ||
        a.assigned_to?.full_name?.toLowerCase().includes(q) ||
        a.department?.name?.toLowerCase().includes(q),
    );
  }, [disposedAssets, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <button
          onClick={handleBackToOverview}
          className="flex items-center gap-2 text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform w-fit"
        >
          <ArrowLeft className="w-3 h-3" />{' '}
          {selectedCategory ? 'Back to Registry' : 'Back to Audit Hub'}
        </button>

        {selectedCategory && (
          <div className="flex bg-white/60 backdrop-blur-md p-1 px-4 rounded-xl border border-white shadow-sm items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Audit Period:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none p-0 cursor-pointer"
              />
              <span className="text-slate-300 mx-1">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none p-0 cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
              </button>
            )}
            <div className="w-px h-4 bg-slate-200 mx-2" />
            <button
              onClick={handleExportLogs}
              disabled={filteredAssets.length === 0}
              className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-[#ff8000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Download CSV Export"
            >
              <History className="w-3.5 h-3.5 text-[#ff8000]" /> Disposal log
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Total Retired
            </p>
            <h3 className="text-lg font-black text-slate-800 leading-none">
              {disposedAssets.length}{' '}
              <span className="text-[9px] font-bold text-slate-400">UNITS</span>
            </h3>
          </div>
          <Archive className="w-5 h-5 text-slate-100" />
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Recovery Value
            </p>
            <h3 className="text-lg font-black text-[#ff8000] leading-none">
              {metrics.totalRecovery.toLocaleString()}{' '}
              <span className="text-[9px] font-bold text-orange-200">RWF</span>
            </h3>
          </div>
          <TrendingDown className="w-5 h-5 text-orange-50" />
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Avg. Service Life
            </p>
            <h3 className="text-lg font-black text-slate-800 leading-none">
              {metrics.avgLifecycle}{' '}
              <span className="text-[9px] font-bold text-slate-400">YEARS</span>
            </h3>
          </div>
          <Calendar className="w-5 h-5 text-slate-100" />
        </div>
      </div>

      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {categoryMetrics.map((cat) => {
            const CatIcon = getCategoryIcon(cat.name);
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="group relative bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-xl hover:border-[#ff8000]/30 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff8000]/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                    <CatIcon className="w-6 h-6 text-[#ff8000]" />
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-[#ff8000] transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Retired
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {cat.count} Units
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-100" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Recovered
                      </span>
                      <span className="text-sm font-black text-slate-800">
                        {cat.recovery.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#ff8000] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      View Logs &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedCategory.name} disposal records...`}
                className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Asset & Identifiers
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Lifecycle Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Financials
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Previous Custodian
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400 font-bold"
                      >
                        Retrieving records...
                      </td>
                    </tr>
                  )}
                  {filteredAssets.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <Archive className="w-12 h-12 text-slate-100 mb-4" />
                          <p className="text-slate-400 font-bold">
                            No {selectedCategory.name} disposal records found.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredAssets.map((asset) => {
                    const RowIcon = getCategoryIcon(asset.category?.name);
                    const lifecycleYears =
                      asset.purchase_date && asset.disposal_date
                        ? (
                            (new Date(asset.disposal_date).getTime() -
                              new Date(asset.purchase_date).getTime()) /
                            (1000 * 60 * 60 * 24 * 365.25)
                          ).toFixed(1)
                        : 'N/A';

                    return (
                      <tr
                        key={asset.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                              <RowIcon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 truncate">
                                {asset.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                                  {asset.tag_id || 'NO TAG'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                                  {asset.serial_number || 'NO SN'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <FileText className="w-3 h-3 text-slate-300" />
                              {asset.disposal_reason || 'End of life'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded">
                                {lifecycleYears} yrs
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium italic">
                                Retired{' '}
                                {asset.disposal_date
                                  ? new Date(
                                      asset.disposal_date,
                                    ).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-xs font-black text-slate-700">
                                {Number(
                                  asset.disposal_value || 0,
                                ).toLocaleString()}{' '}
                                RWF
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                Recovery
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                              <Box className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500">
                                {Number(
                                  asset.purchase_cost || 0,
                                ).toLocaleString()}{' '}
                                RWF
                              </span>
                              <span className="text-[9px] font-bold text-slate-300 uppercase">
                                Input Cost
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col min-w-[140px]">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                              {getResolvedCustodian(asset) ||
                                asset.department?.name ||
                                'General Inventory'}
                            </span>
                            {getResolvedCustodian(asset) &&
                              asset.department && (
                                <span className="text-[10px] font-bold text-[#ff8000] flex items-center gap-1 mt-0.5">
                                  {asset.department.name}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => setAssetToView(asset)}
                            className="p-1.5 text-slate-300 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                            title="View Disposal Certificate"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ViewAssetModal
        isOpen={!!assetToView}
        onClose={() => setAssetToView(null)}
        asset={assetToView}
      />

      <ConfirmActionModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={() => {
          setShowExportConfirm(false);
          setTimeout(() => handleExportLogs(), 100);
        }}
        title="Confirm Full Export"
        message="No Audit Period is currently selected. This export will include ALL historical disposal records for this category. Do you wish to continue?"
        confirmText="Download All"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
};
