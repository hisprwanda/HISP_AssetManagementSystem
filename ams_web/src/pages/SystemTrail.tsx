import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Search,
  Upload,
  ArrowLeft,
  Shield,
  Building2,
  Mail,
  X,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  History,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { Pagination } from '../components/Pagination';

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
    ExcelJS: unknown;
  }
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  department?: { name: string; type: string };
  status?: string;
  password_hash?: string;
  provisioning_password?: string;
  created_at: string;
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('System Audit & Provisioning');
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src =
        'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
    if (!window.ExcelJS) {
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterDept, startDate, endDate]);

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

  const { data: allDepartments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  const validUsers = useMemo(() => {
    if (!users) return [];

    let filtered = [...users];

    if (startDate) {
      filtered = filtered.filter((u) => {
        const date = new Date(u.created_at);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((u) => {
        const date = new Date(u.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    if (filterRole !== 'ALL') {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterDept !== 'ALL') {
      filtered = filtered.filter((u) => u.department?.name === filterDept);
    }

    return filtered;
  }, [users, startDate, endDate, filterRole, filterDept]);

  const roleOptions = useMemo(() => {
    if (!users) return [];
    const roles = new Set(users.map((u) => u.role));
    return Array.from(roles).sort();
  }, [users]);

  const deptOptions = useMemo(() => {
    if (!users) return [];
    const depts = new Set(users.map((u) => u.department?.name).filter(Boolean));
    return Array.from(depts).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return validUsers;

    return validUsers.filter(
      (user) =>
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q),
    );
  }, [validUsers, searchQuery]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const bulkCreateMutation = useMutation({
    mutationFn: async (userData: Record<string, unknown>[]) => {
      const chunkSize = 10;
      const aggregateResult = { success: 0, failed: 0, errors: [] as string[] };

      for (let i = 0; i < userData.length; i += chunkSize) {
        const chunk = userData.slice(i, i + chunkSize);
        const response = await api.post('/users/bulk', chunk);
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsUploading(false);
    },
    onError: (error: {
      response?: { data?: { message?: string | string[] } };
      message: string;
    }) => {
      setIsUploading(false);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Check the file format and try again.';
      alert(
        `Bulk Provisioning Failure: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`,
      );
    },
  });

  const handleDownloadTemplate = async () => {
    if (!window.ExcelJS) {
      alert(
        'Excel provisioning engine is still loading. Please wait a moment and try again.',
      );
      return;
    }

    const workbook = new (window.ExcelJS as any).Workbook(); // eslint-disable-line @typescript-eslint/no-explicit-any
    const worksheet = workbook.addWorksheet('Registration Template');
    const dataSheet = workbook.addWorksheet('Valid Data');
    dataSheet.state = 'hidden';

    const deptNames = allDepartments?.map((d) => d.name) ||
      deptOptions || ['Admin and Finance', 'Office of the CEO'];

    const roles = [
      'STAFF',
      'HOD',
      'FINANCE_OFFICER',
      'OPERATIONS_OFFICER',
      'ADMIN AND FINANCE DIRECTOR',
    ];

    deptNames.forEach((name, i) => {
      dataSheet.getCell(i + 1, 1).value = name;
    });

    roles.forEach((role, i) => {
      dataSheet.getCell(i + 1, 2).value = role;
    });
    worksheet.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Department', key: 'dept', width: 30 },
      { header: 'Password', key: 'pass', width: 15 },
    ];
    worksheet.addRow({
      name: 'Name of Staff',
      email: '[EMAIL_ADDRESS]',
      phone: '0780000000',
      role: 'STAFF',
      dept: deptNames[0] || 'ICT',
      pass: 'xxxxxxxxx',
    });

    for (let i = 2; i <= 500; i++) {
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'Valid Data'!$B$1:$B$${roles.length}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Role',
        error: 'Please select a role from the dropdown list.',
      };
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'Valid Data'!$A$1:$A$${deptNames.length}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Department',
        error: 'Please select a valid organizational unit from the dropdown.',
      };
    }
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF8000' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hisp_bulk_provisioning_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportLogs = () => {
    if (!validUsers.length) return;

    if (!startDate && !endDate && !showExportConfirm) {
      setShowExportConfirm(true);
      return;
    }

    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone Number',
      'Role',
      'Department',
      'Provisioning Password',
      'Provisioned At',
    ];

    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = str.toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = validUsers.map((u) => [
      escapeCSV(u.id),
      escapeCSV(u.full_name),
      escapeCSV(u.email),
      escapeCSV(u.phone_number || 'N/A'),
      escapeCSV(u.role).toUpperCase(),
      escapeCSV(u.department?.name || 'Unassigned'),
      escapeCSV(u.provisioning_password || '********'),
      escapeCSV(new Date(u.created_at).toLocaleDateString()),
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

    link.setAttribute('download', `hisp_provisioning_logs_${dateStr}.csv`);
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

        const normalizedData = jsonData
          .map((r: Record<string, unknown>) => {
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
          );

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
          className="flex items-center gap-2 text-[10px] font-semibold text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform"
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
              title="Download provisioning history"
            >
              <History className="w-3.5 h-3.5 text-[#ff8000]" /> Export logs
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              disabled={isUploading}
              className="px-4 py-2 bg-[#ff8000] text-white rounded-xl font-semibold text-[9px] uppercase tracking-widest transition-all shadow-lg hover:shadow-orange-200 flex items-center gap-2 disabled:opacity-50"
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
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-2 flex items-center justify-between">
        <div className="relative flex-1 max-w-md pl-2 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-0 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Organisational Units</option>
            {deptOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All System Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] w-full">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Personnel
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Phone Number
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Directorate
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  System Role
                </th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-32 text-center text-[10px] font-semibold text-slate-300 uppercase tracking-[0.25em]"
                  >
                    Synchronizing User Records...
                  </td>
                </tr>
              )}
              {!isLoading &&
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-white transition-colors text-[#ff8000]">
                          <Users className="w-5 h-5 text-[#ff8000]/40 group-hover:text-[#ff8000] transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm">
                            {user.full_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 uppercase tracking-tight">
                            <Clock className="w-2.5 h-2.5" /> Registered:{' '}
                            {new Date(
                              user.created_at || Date.now(),
                            ).toLocaleDateString()}
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
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-tight">
                          {user.department?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-400/50" />
                        <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest">
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {user.status === 'ACTIVE' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                          {user.status || 'INACTIVE'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
        />
      </div>

      {uploadResult && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.1)] flex items-center gap-4 max-w-sm">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${uploadResult.failed > 0 ? 'bg-amber-50 text-amber-500' : 'bg-orange-50 text-[#ff8000]'}`}
            >
              {uploadResult.failed > 0 ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                Provisioning Task
              </h3>
              <p className="text-[11px] font-bold text-slate-700 leading-tight">
                <span
                  className={
                    uploadResult.failed > 0
                      ? 'text-amber-600'
                      : 'text-orange-600'
                  }
                >
                  {uploadResult.success} staff members registered.
                </span>
                {uploadResult.failed > 0 && (
                  <span className="block text-[9px] text-slate-400 mt-1 uppercase font-semibold tracking-widest">
                    {uploadResult.failed} validation errors
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

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-lg w-full border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff8000] border border-orange-100 shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                    Registration Template
                  </h3>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    Directory Schema Requirements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1.5 bg-orange-50 text-[#ff8000] border border-orange-100 rounded-lg font-semibold text-[8px] uppercase tracking-widest hover:bg-[#ff8000] hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Download Excel Template"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  Download Excel Template
                </button>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
              Please ensure your CSV or Excel file follows the structural
              requirements below for successful bulk provisioning.
            </p>

            <div className="space-y-6">
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#ff8000] rounded-full" />{' '}
                  MANDATORY
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
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />{' '}
                  OPTIONAL
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-400 shadow-sm">
                    Password
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 py-4 rounded-xl font-semibold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-4 rounded-xl font-semibold text-[10px] uppercase tracking-widest text-white bg-[#ff8000] hover:bg-orange-600 shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transition-all active:scale-95"
              >
                Confirm & Provision
              </button>
            </div>
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
        title="Confirm Full Directory Export"
        message="You haven't selected a specific Audit Period. This will export the entire personnel directory. This may take a few moments depending on the volume of data."
        confirmText="Proceed with Full Export"
        variant="warning"
      />
    </div>
  );
};
