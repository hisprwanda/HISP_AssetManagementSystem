import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  History,
  TrendingDown,
  TrendingUp,
  Banknote,
  Building2,
  Calendar,
  Box,
  Filter,
  Trash2,
} from 'lucide-react';
import { Asset } from '../types/assets';
import { api } from '../lib/api';
import { Pagination } from '../components/Pagination';
import { ConfirmActionModal } from '../components/ConfirmActionModal';

const getCategoryIcon = (categoryName?: string) => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('laptop') || name.includes('computer')) return Box;
  return Box;
};

export const FinancialTrail = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const itemsPerPage = 12;

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Financial Records');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    let filtered = assets.filter((a) => a.status !== 'DISPOSED');

    if (filterDept !== 'ALL') {
      filtered = filtered.filter((a) => a.department?.name === filterDept);
    }

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter((a) => a.category?.name === filterCategory);
    }

    if (startDate) {
      filtered = filtered.filter((a) => {
        const date = new Date(a.purchase_date || a.created_at || '');
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((a) => {
        const date = new Date(a.purchase_date || a.created_at || '');
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tag_id?.toLowerCase().includes(q) ||
          a.serial_number?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [assets, filterDept, filterCategory, searchQuery, startDate, endDate]);

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(start, start + itemsPerPage);
  }, [filteredAssets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const stats = useMemo(() => {
    const totalCost = filteredAssets.reduce(
      (sum, a) => sum + Number(a.purchase_cost || 0),
      0,
    );
    const totalValue = filteredAssets.reduce(
      (sum, a) => sum + Number(a.current_value || 0),
      0,
    );
    const totalDepreciation = filteredAssets.reduce(
      (sum, a) => sum + Number(a.accumulated_depreciation || 0),
      0,
    );

    return [
      {
        label: 'Total Acquisition Cost',
        value: totalCost,
        icon: Banknote,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        label: 'Net Book Value',
        value: totalValue,
        icon: TrendingUp,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        label: 'Accumulated Depreciation',
        value: totalDepreciation,
        icon: TrendingDown,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
      },
    ];
  }, [filteredAssets]);

  const deptOptions = useMemo(() => {
    if (!assets) return [];
    const depts = new Set(
      assets.map((a) => a.department?.name).filter(Boolean),
    );
    return Array.from(depts).sort();
  }, [assets]);

  const categoryOptions = useMemo(() => {
    if (!assets) return [];
    const cats = new Set(assets.map((a) => a.category?.name).filter(Boolean));
    return Array.from(cats).sort();
  }, [assets]);

  const handleExportLogs = () => {
    if (!filteredAssets.length) return;

    if (!startDate && !endDate && !showExportConfirm) {
      setShowExportConfirm(true);
      return;
    }

    const headers = [
      'Asset Name',
      'Tag ID',
      'Category',
      'Department',
      'Purchase Cost',
      'Accumulated Depreciation',
      'Current Value',
      'Purchase Date',
    ];

    const escapeCSV = (str: string | number | null | undefined) => {
      if (str === undefined || str === null) return '""';
      const clean = str.toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = filteredAssets.map((a) => [
      escapeCSV(a.name),
      escapeCSV(a.tag_id),
      escapeCSV(a.category?.name),
      escapeCSV(a.department?.name),
      escapeCSV(a.purchase_cost),
      escapeCSV(a.accumulated_depreciation),
      escapeCSV(a.current_value),
      escapeCSV(a.purchase_date),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const dateStr =
      startDate && endDate
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0];

    link.setAttribute('download', `hisp_financial_logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportConfirm(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 pb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/audit-trail')}
          className="flex items-center gap-2 text-[10px] font-semibold text-[#ff8000] uppercase tracking-widest hover:translate-x-1 transition-transform"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white/60 backdrop-blur-md p-1 px-4 rounded-xl border border-white shadow-sm items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Audit Period:
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none p-0 cursor-pointer"
                />
                <span className="text-slate-300 mx-0.5">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none p-0 cursor-pointer"
                />
              </div>
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                title="Clear Filters"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
              </button>
            )}

            <div className="w-px h-4 bg-slate-200 mx-2" />

            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 text-[9px] font-semibold text-slate-600 uppercase tracking-widest hover:text-[#ff8000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Download financial history"
            >
              <History className="w-3.5 h-3.5 text-[#ff8000]" /> Export logs
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center transition-all duration-300`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                {stat.label}
              </p>
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                {stat.value.toLocaleString()}
                <span className="text-[10px] font-medium text-slate-400 ml-1">
                  RWF
                </span>
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md pl-2 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-0 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 pr-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20 appearance-none"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat as string} value={cat as string}>
                  {cat as string}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20 appearance-none"
            >
              <option value="ALL">All Departments</option>
              {deptOptions.map((dept) => (
                <option key={dept as string} value={dept as string}>
                  {dept as string}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Asset Details
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Directorate
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Acquisition
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Financial Performance
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">
                  Net Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-20 text-center text-slate-400 font-medium italic"
                  >
                    Loading records...
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => {
                  const Icon = getCategoryIcon(asset.category?.name);
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/50 group transition-colors"
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 tracking-tight">
                              {asset.name}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                              {asset.tag_id || 'NO TAG'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                            {asset.department?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700">
                            {(asset.purchase_cost || 0).toLocaleString()} RWF
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] font-medium text-slate-400 uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {asset.purchase_date
                              ? new Date(
                                  asset.purchase_date,
                                ).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-rose-400 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ((asset.accumulated_depreciation || 0) / (asset.purchase_cost || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                              {Math.round(
                                ((asset.accumulated_depreciation || 0) /
                                  (asset.purchase_cost || 1)) *
                                  100,
                              )}
                              % Dep.
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />-
                            {(
                              asset.accumulated_depreciation || 0
                            ).toLocaleString()}{' '}
                            RWF
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-emerald-600 tracking-tight">
                            {(asset.current_value || 0).toLocaleString()} RWF
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                            Current Value
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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

      <ConfirmActionModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={() => {
          setShowExportConfirm(false);
          setTimeout(() => handleExportLogs(), 100);
        }}
        title="Confirm Full Financial Export"
        message="You haven't selected a specific Audit Period. This will export the complete historical financial trail of all assets."
        confirmText="Proceed with Full Export"
        variant="warning"
      />
    </div>
  );
};
