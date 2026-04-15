import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  ClipboardCheck,
  Eye,
  ArrowLeft,
  Download,
  Calendar,
  CheckCircle2,
  FileCheck,
  User as UserIcon,
  Laptop,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetAssignment } from '../types/assets';
import { AssetReceiptFormModal } from '../components/AssetReceiptFormModal';

export const AssignmentHistory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssetAssignment | null>(null);

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Assignment History');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: assignments, isLoading } = useQuery<AssetAssignment[]>({
    queryKey: ['asset-assignments'],
    queryFn: async () => {
      const response = await api.get('/asset-assignments');
      return response.data;
    },
  });

  const validAssignments = useMemo(() => {
    if (!assignments) return [];

    return assignments.sort(
      (a, b) =>
        new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
    );
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return validAssignments;

    return validAssignments.filter(
      (a) =>
        a.asset?.name?.toLowerCase().includes(q) ||
        a.asset?.serial_number?.toLowerCase().includes(q) ||
        a.user?.full_name?.toLowerCase().includes(q) ||
        a.form_number?.toLowerCase().includes(q),
    );
  }, [validAssignments, searchQuery]);

  const handleExportLogs = () => {
    if (!validAssignments.length) return;

    const headers = [
      'Form Number',
      'Status',
      'Asset Name',
      'Serial Number',
      'Assigned To',
      'Directorate',
      'Assigned Date',
      'Condition',
    ];

    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = str.toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = validAssignments.map((a) => [
      escapeCSV(a.form_number || 'LEGACY'),
      escapeCSV(a.form_status),
      escapeCSV(a.asset?.name || 'Unknown Asset'),
      escapeCSV(a.asset?.serial_number || 'N/A'),
      escapeCSV(a.user?.full_name || 'N/A'),
      escapeCSV(a.user?.department?.name || 'N/A'),
      escapeCSV(new Date(a.assigned_at).toLocaleDateString()),
      escapeCSV(a.condition_on_assign || 'N/A'),
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
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `assignment_history_${dateStr}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <button
            onClick={() => navigate('/audit-trail')}
            className="flex items-center gap-2 text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/60 backdrop-blur-md border border-white p-1 rounded-xl shadow-sm text-sm">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assignments..."
                className="w-full bg-transparent border-none pl-10 pr-4 py-2 focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
          <button
            onClick={handleExportLogs}
            disabled={validAssignments.length === 0}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Form Details
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Asset Informaiton
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Recipient
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
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
                    Retrieving assignment records...
                  </td>
                </tr>
              )}
              {filteredAssignments.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <ClipboardCheck className="w-12 h-12 text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold">
                        No assignment records found.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredAssignments.map((assignment) => {
                const isApproved = assignment.form_status === 'APPROVED';
                return (
                  <tr
                    key={assignment.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff8000] border border-orange-100 shadow-inner group-hover:scale-110 transition-transform">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 truncate">
                            {assignment.form_number || 'LEGACY FORM'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              assignment.assigned_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          {assignment.asset?.name || 'Unknown Asset'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                            {assignment.asset?.tag_id || 'NO TAG'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            SN: {assignment.asset?.serial_number || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col min-w-[140px]">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          {assignment.user?.full_name || 'N/A'}
                        </span>
                        {assignment.user?.department && (
                          <span className="text-[10px] font-bold text-[#ff8000] mt-0.5 ml-4.5">
                            {assignment.user.department.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm
                            ${
                              isApproved
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : assignment.form_status === 'REJECTED'
                                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                                  : 'bg-orange-50 border-orange-200 text-orange-600'
                            }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {assignment.form_status?.replace(/_/g, ' ') || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="p-2 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-xl transition-all"
                        title="View Asset Receipt Form"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AssetReceiptFormModal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
      />
    </div>
  );
};
