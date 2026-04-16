import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Search,
  Download,
  Upload,
  ArrowLeft,
  Shield,
  Building2,
  Mail,
  X,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../lib/api';

declare global {
  interface Window {
    XLSX: {
      read: (
        data: unknown,
        options: unknown,
      ) => {
        SheetNames: string[];
        Sheets: Record<string, unknown>;
      };
      utils: {
        sheet_to_json: (worksheet: unknown) => Record<string, unknown>[];
      };
    };
  }
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  department?: { name: string; type: string };
}

export const SystemTrail = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('System Audit & Provisioning');

    // Load XLSX from CDN for robustness
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src =
        'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  // Auto-dismiss upload result after 6 seconds
  useEffect(() => {
    if (uploadResult) {
      const timer = setTimeout(() => {
        setUploadResult(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [uploadResult]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const bulkCreateMutation = useMutation({
    mutationFn: async (userData: Record<string, unknown>[]) => {
      const response = await api.post('/users/bulk', userData);
      return response.data;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsUploading(false);
    },
    onError: (error: {
      response?: { data?: { message?: string | string[] } };
      message: string;
    }) => {
      setIsUploading(false);
      console.error(
        'Bulk Upload Error Detail:',
        error.response?.data || error.message,
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Check the file format and try again.';
      alert(
        `Bulk upload failed: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`,
      );
    },
  });

  const handleExportCSV = () => {
    if (!users) return;
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone Number',
      'Role',
      'Department',
    ];
    const rows = users.map((u) => [
      u.id,
      u.full_name,
      u.email,
      u.phone_number || 'N/A',
      u.role,
      u.department?.name || 'Unassigned',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hisp_users_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.XLSX) {
      alert(
        'Provisioning engine is still loading. Please wait a moment and try again.',
      );
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet);

        // Normalize data to match backend expectations (handle common header variations and extra spaces)
        const normalizedData = jsonData
          .map((r: Record<string, unknown>) => {
            // Normalize keys by trimming and case-insensitive check
            const row: Record<string, unknown> = {};
            Object.keys(r).forEach((k) => {
              row[k.trim()] = r[k];
            });

            return {
              full_name: (
                row['Full Name'] ||
                row.full_name ||
                row.FullName ||
                row.name ||
                ''
              )
                .toString()
                .trim(),
              email: (row['Email'] || row.email || row.EmailAddress || '')
                .toString()
                .trim(),
              phone_number: (
                row['Phone Number'] ||
                row.phone_number ||
                row.phone ||
                row.phoneNumber ||
                ''
              )
                .toString()
                .trim(),
              role: (row['Role'] || row.role || row.SystemRole || '')
                .toString()
                .trim(),
              department_name: (
                row['Department'] ||
                row.department ||
                row.department_name ||
                row.DepartmentName ||
                ''
              )
                .toString()
                .trim(),
              password: (row.password || row['Password'] || '')
                .toString()
                .trim(),
            };
          })
          .filter(
            (u: { full_name: string; email: string; phone_number: string }) =>
              u.full_name && u.email && u.phone_number,
          ); // Filter out empty or incomplete rows

        bulkCreateMutation.mutate(normalizedData);
      } catch (err) {
        console.error('File parsing error:', err);
        alert(
          'Failed to parse file. Please ensure it is a valid CSV or Excel document.',
        );
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <button
          onClick={() => navigate('/audit-trail')}
          className="flex items-center gap-2 text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm hover:bg-slate-50 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#ff8000]" /> Export Directory
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            disabled={isUploading}
            className="px-4 py-2 bg-[#ff8000] text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg hover:shadow-orange-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? 'Processing...' : 'Bulk Provision'}
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

      {uploadResult && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex items-start gap-6 max-w-lg min-w-[400px]">
            <button
              onClick={() => setUploadResult(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${uploadResult.failed > 0 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}
            >
              {uploadResult.failed > 0 ? (
                <AlertCircle className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 mb-1">
                Provisioning Complete
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-4">
                Successfully registered{' '}
                <span className="text-emerald-600 font-black">
                  {uploadResult.success}
                </span>{' '}
                users.
                {uploadResult.failed > 0 && (
                  <span>
                    {' '}
                    Encountered{' '}
                    <span className="text-rose-500 font-black">
                      {uploadResult.failed}
                    </span>{' '}
                    errors.
                  </span>
                )}
              </p>

              {uploadResult.errors.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 max-h-32 overflow-y-auto border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Error Log
                  </p>
                  <ul className="space-y-1">
                    {uploadResult.errors.map((err, i) => (
                      <li
                        key={i}
                        className="text-[10px] font-bold text-rose-500 flex items-center gap-2"
                      >
                        <div className="w-1 h-1 bg-rose-300 rounded-full" />{' '}
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Simple progress timer bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-emerald-400/20 w-full">
              <div
                className="h-full bg-emerald-400 animate-out fade-out fill-mode-forwards"
                style={{ animationDuration: '6000ms', width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[500px] w-full">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-white shadow-sm pl-12 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8000]/20 outline-none font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Personnel
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Phone Number
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Directorate
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  System Role
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-32 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]"
                  >
                    Synchronizing User Records...
                  </td>
                </tr>
              )}
              {!isLoading &&
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-white transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm">
                            {user.full_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[11px] font-bold text-slate-500 tracking-tight">
                        {user.phone_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-300" />
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                          {user.department?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-400/50" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Instructions Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff8000]">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pt-6">
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                Registration Template
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                Please ensure your CSV or Excel file follows the structural
                requirements below for successful bulk provisioning.
              </p>

              <div className="space-y-6">
                <div className="p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-3">
                    Mandatory Columns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Full Name',
                      'Email',
                      'Phone Number',
                      'Department',
                      'Role',
                    ].map((col) => (
                      <span
                        key={col}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 shadow-sm"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Optional Columns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 shadow-sm">
                      Password
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-4 px-6 bg-[#ff8000] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-[0.98]"
                >
                  Proceed to Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
