import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Laptop,
  Search,
  Upload,
  ArrowLeft,
  Building2,
  X,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Tag,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  Box,
  History,
  Trash2,
} from 'lucide-react';
import { Asset } from '../types/assets';
import { api } from '../lib/api';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { Pagination } from '../components/Pagination';

const getCategoryIcon = (categoryName?: string) => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('laptop') || name.includes('computer')) return Laptop;
  return Box;
};

export const AssetTrail = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Asset Trail');

    if (!(window as unknown as { XLSX: unknown }).XLSX) {
      const script = document.createElement('script');
      script.src =
        'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterCategory,
    filterStatus,
    filterDept,
    startDate,
    endDate,
  ]);

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const validAssets = useMemo(() => {
    if (!assets) return [];
    let filtered = [...assets];

    if (startDate) {
      filtered = filtered.filter((a) => {
        const dateString = a.purchase_date || a.created_at || '';
        const date = new Date(dateString);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((a) => {
        const dateString = a.purchase_date || a.created_at || '';
        const date = new Date(dateString);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter((a) => a.category?.name === filterCategory);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    if (filterDept !== 'ALL') {
      filtered = filtered.filter((a) => a.department?.name === filterDept);
    }

    return filtered;
  }, [assets, startDate, endDate, filterCategory, filterStatus, filterDept]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return validAssets;

    return validAssets.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.tag_id?.toLowerCase().includes(q) ||
        a.serial_number?.toLowerCase().includes(q) ||
        a.assigned_to?.full_name?.toLowerCase().includes(q),
    );
  }, [validAssets, searchQuery]);

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(start, start + itemsPerPage);
  }, [filteredAssets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const categoryOptions = useMemo(() => {
    if (!assets) return [];
    const cats = new Set(assets.map((a) => a.category?.name).filter(Boolean));
    return Array.from(cats).sort();
  }, [assets]);

  const deptOptions = useMemo(() => {
    if (!assets) return [];
    const depts = new Set(
      assets.map((a) => a.department?.name).filter(Boolean),
    );
    return Array.from(depts).sort();
  }, [assets]);

  const statusOptions = [
    'IN_STOCK',
    'ASSIGNED',
    'BROKEN',
    'MISSING',
    'DISPOSED',
  ];

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: object[]) => {
      const chunkSize = 10;
      const aggregateResult = { success: 0, failed: 0, errors: [] as string[] };

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const response = await api.post('/assets/batch-update', chunk);
        const resData = response.data;

        aggregateResult.success += resData.success || 0;
        aggregateResult.failed += resData.failed || 0;
        if (resData.errors) {
          aggregateResult.errors.push(...resData.errors);
        }
      }

      return aggregateResult;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Bulk Authorization Failed: ${message}`);
    },
  });

  const handleExportLogs = () => {
    if (!validAssets.length) return;

    if (!startDate && !endDate && !showExportConfirm) {
      setShowExportConfirm(true);
      return;
    }

    const headers = [
      'Tag ID',
      'Asset Name',
      'Category',
      'Serial Number',
      'Department',
      'Personnel',
      'Location',
      'Status',
      'Purchase Cost',
      'Current Value',
      'Purchase Date',
    ];

    const escapeCSV = (str: string | number | null | undefined) => {
      if (str === undefined || str === null) return '""';
      const clean = str.toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = validAssets.map((a) => [
      escapeCSV(a.tag_id),
      escapeCSV(a.name),
      escapeCSV(a.category?.name),
      escapeCSV(a.serial_number),
      escapeCSV(a.department?.name),
      escapeCSV(a.assigned_to?.full_name || 'N/A'),
      escapeCSV(a.location),
      escapeCSV(a.status),
      escapeCSV(a.purchase_cost),
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

    link.setAttribute('download', `hisp_asset_logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Tag ID',
      'Asset Name',
      'Category',
      'Serial Number',
      'Department',
      'Personnel',
      'Location',
      'Status',
      'Purchase Cost',
      'Current Value',
      'Purchase Date',
    ];
    const csvContent =
      headers.join(',') +
      '\n"TAG-001","MacBook Pro M2","LAPTOP","SN12345678","ICT","Personnel Name","HQ","ASSIGNED","2500000","2100000","2024-01-15"';

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hisp_bulk_asset_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const xlsx = (
      window as unknown as {
        XLSX: {
          read: (data: unknown, options: unknown) => unknown;
          utils: { sheet_to_json: (ws: unknown, opts: unknown) => unknown[] };
        };
      }
    ).XLSX;
    if (!file || !xlsx) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' }) as {
          SheetNames: string[];
          Sheets: Record<string, unknown>;
        };
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, {
          cellDates: true,
        });

        const normalizedData = (jsonData as Record<string, unknown>[]).map(
          (r) => {
            const rawDate = r['Purchase Date'] || r.purchase_date || null;
            let pDate = null;

            if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
              pDate = rawDate.toISOString().split('T')[0];
            } else if (typeof rawDate === 'number') {
              const dateObj = new Date((rawDate - 25569) * 86400 * 1000);
              if (!isNaN(dateObj.getTime())) {
                pDate = dateObj.toISOString().split('T')[0];
              }
            } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
              const dateObj = new Date(rawDate);
              if (!isNaN(dateObj.getTime())) {
                pDate = dateObj.toISOString().split('T')[0];
              }
            }

            const statusRaw = (r['Status'] || r.status || 'IN_STOCK')
              .toString()
              .trim()
              .toUpperCase()
              .replace(/ /g, '_');

            return {
              name: (r['Asset Name'] || r.name || '').toString().trim(),
              tag_id: (r['Tag ID'] || r.tag_id || '').toString().trim() || null,
              category_name:
                (r['Category'] || r.category || '').toString().trim() || null,
              serial_number:
                (r['Serial Number'] || r.serial_number || '')
                  .toString()
                  .trim() || null,
              department_name:
                (r['Department'] || r.department || '').toString().trim() ||
                null,
              location:
                (r['Location'] || r.location || '').toString().trim() || null,
              purchase_cost:
                r['Purchase Cost'] || r.purchase_cost
                  ? Number(r['Purchase Cost'] || r.purchase_cost)
                  : 0,
              purchase_date: pDate,
              status:
                statusRaw === 'IN_STOCK' ||
                statusRaw === 'ASSIGNED' ||
                statusRaw === 'BROKEN' ||
                statusRaw === 'MISSING' ||
                statusRaw === 'DISPOSED'
                  ? statusRaw
                  : 'IN_STOCK',
            };
          },
        );

        bulkCreateMutation.mutate(normalizedData);
      } catch {
        alert('Data Parsing Failure.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/audit-trail')}
          className="flex items-center gap-2 text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white/60 backdrop-blur-md p-1 px-4 rounded-xl border border-white shadow-sm items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
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
              className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-[#ff8000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Download asset history"
            >
              <History className="w-3.5 h-3.5 text-[#ff8000]" /> Export logs
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-5 py-2.5 bg-[#ff8000] text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] hover:bg-orange-600 flex items-center gap-2 group active:scale-95"
            >
              <Upload className="w-4 h-4 text-orange-200" />
              Import Asset
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
          </div>
        </div>
      </div>
      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-2 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md pl-2 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
          <input
            type="text"
            placeholder="Search by name, tag, or personnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-0 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Units</option>
            {deptOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Asset
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tag/Serial
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ownership
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Financials
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Acquisition
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!isLoading &&
                paginatedAssets.map((asset) => {
                  const Icon = getCategoryIcon(asset.category?.name);
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/50 group transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 text-[#ff8000] group-hover:scale-110 transition-transform">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 tracking-tight">
                              {asset.name}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              {asset.category?.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-widest">
                            <Tag className="w-3.5 h-3.5 text-orange-400" />{' '}
                            {asset.tag_id || 'N/A'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300 flex items-center gap-2 uppercase tracking-widest">
                            <ShieldCheck className="w-3.5 h-3.5" />{' '}
                            {asset.serial_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-slate-700 flex items-center gap-2 uppercase leading-none">
                            <UserIcon className="w-3.5 h-3.5 text-slate-300" />{' '}
                            {asset.assigned_to?.full_name || 'IN STORE'}
                          </span>
                          <span className="text-[9px] font-black text-[#ff8000] uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-orange-300" />{' '}
                            {asset.department?.name || 'CENTRAL OPERATIONS'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 tracking-tight">
                            {Number(asset.current_value || 0).toLocaleString()}{' '}
                            RWF
                          </span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5 font-sans">
                            Cost:{' '}
                            {Number(asset.purchase_cost || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            asset.status === 'ASSIGNED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : asset.status === 'DISPOSED'
                                ? 'bg-slate-50 text-slate-400 border-slate-200'
                                : 'bg-orange-50 text-orange-600 border-orange-200'
                          }`}
                        >
                          {asset.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {asset.purchase_date
                            ? new Date(asset.purchase_date).toLocaleDateString()
                            : 'N/A'}
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
      </div>{' '}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-lg w-full border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff8000] border border-orange-100 shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    Import Template
                  </h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Asset Registry Requirements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1.5 bg-orange-50 text-[#ff8000] border border-orange-100 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-[#ff8000] hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Download CSV Template"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  Download csv Template
                </button>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
              Ensure your file includes these columns to match our hardware
              schema:
            </p>

            <div className="space-y-6">
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#ff8000] rounded-full" />{' '}
                  MANDATORY
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Asset Name',
                    'Category',
                    'Tag ID',
                    'Status',
                    'Purchase Cost',
                    'Department',
                  ].map((col) => (
                    <span
                      key={col}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />{' '}
                  OPTIONAL
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Purchase Date', 'Location', 'Serial Number'].map((col) => (
                    <span
                      key={col}
                      className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-400 shadow-sm"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-[#ff8000] hover:bg-orange-600 shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transition-all active:scale-95"
              >
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}
      {uploadResult && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.1)] flex items-center gap-4 max-w-sm">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${uploadResult.failed > 0 ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-[#ff8000]'}`}
            >
              {uploadResult.failed > 0 ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                Import Notification
              </h3>
              <p className="text-[11px] font-bold text-slate-700 leading-tight">
                <span
                  className={
                    uploadResult.failed > 0
                      ? 'text-rose-500'
                      : 'text-orange-600'
                  }
                >
                  {uploadResult.success} assets synchronized.
                </span>
                {uploadResult.failed > 0 && (
                  <span className="block text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                    {uploadResult.failed} Schema Conflicts
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-300 hover:text-slate-900 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <ConfirmActionModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={() => {
          setShowExportConfirm(false);
          setTimeout(() => handleExportLogs(), 100);
        }}
        title="Confirm Full Asset Trail Export"
        message="You haven't selected a specific Audit Period. This will export the complete historical trail of all assets. Large data volumes may affect performance."
        confirmText="Proceed with Full Export"
        variant="warning"
      />
    </div>
  );
};
