import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  X,
  Banknote,
} from 'lucide-react';
import { api } from '../lib/api';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AssetRequest } from '../types/assets';
import { useState, useMemo, useEffect } from 'react';

export const RequestTrail = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Request Trail');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: requests, isLoading } = useQuery<AssetRequest[]>({
    queryKey: ['assets-requests'],
    queryFn: async () => {
      const response = await api.get('/assets-requests');
      return response.data;
    },
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    let filtered = requests;

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.department?.name?.toLowerCase().includes(q) ||
          r.requested_by?.full_name?.toLowerCase().includes(q),
      );
    }

    if (startDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.created_at || 0);
        return date >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.created_at || 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  }, [requests, filterStatus, searchQuery, startDate, endDate]);

  const handleExportLogs = () => {
    if (!filteredRequests.length) return;

    const headers = [
      'Date',
      'Title',
      'Requester',
      'Department',
      'Urgency',
      'Spent/Budget',
      'Status',
    ];
    const rows = filteredRequests.map((r) => [
      new Date(r.created_at || 0).toLocaleDateString(),
      r.title,
      r.requested_by?.full_name || 'N/A',
      r.department?.name || 'N/A',
      r.urgency,
      r.financials?.grand_total || r.estimated_unit_cost || 0,
      r.status,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `request_audit_trail_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAuditSummary = (request: AssetRequest) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;

    const itemsHtml = (request.items || [])
      .map(
        (item: {
          quantity: number;
          name: string;
          description?: string;
          unit_price: number;
        }) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:700">${item.name}<br/><span style="font-size:10px;color:#64748b;font-weight:400">${item.description || ''}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${item.unit_price.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800">${(item.quantity * item.unit_price).toLocaleString()}</td>
      </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Request Audit Summary - ${request.id.slice(0, 8)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 50px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .logo-area h1 { font-size: 28px; font-weight: 900; color: #1e293b; }
          .logo-area p { font-size: 10px; font-weight: 700; color: #ff8000; text-transform: uppercase; letter-spacing: 4px; }
          .audit-badge { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 20px; border-radius: 12px; text-align: right; }
          .audit-badge .label { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
          .audit-badge .value { font-size: 14px; font-weight: 900; color: #1e293b; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section { border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; background: #ffffff; }
          .section-title { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #f1f5f9; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-size: 11px; font-weight: 600; color: #64748b; }
          .info-value { font-size: 11px; font-weight: 700; color: #1e293b; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; border-radius: 12px; overflow: hidden; border: 1px solid #f1f5f9; }
          th { background: #f8fafc; padding: 12px; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: left; }
          td { padding: 12px; font-size: 11px; }
          .status-pill { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #f1f5f9; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: #f1f5f9; z-index: -1; font-weight: 900; text-transform: uppercase; pointer-events: none; }
        </style>
      </head>
      <body>
        <div class="watermark">Audit Verified</div>
        
        <div class="header">
          <div class="logo-area">
            <h1>HISP Rwanda</h1>
            <p>Organisational Asset Management</p>
          </div>
          <div class="audit-badge">
            <div class="label">Audit Summary ID</div>
            <div class="value">LOG-${Date.now().toString().slice(-8)}</div>
            <div class="label" style="margin-top:8px">Verification Date</div>
            <div class="value">${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="grid">
          <div class="section">
            <h2 class="section-title">Requisition Details</h2>
            <div class="info-row"><span class="info-label">Title</span><span class="info-value">${request.title}</span></div>
            <div class="info-row"><span class="info-label">Reference ID</span><span class="info-value">${request.id}</span></div>
            <div class="info-row"><span class="info-label">Submission Date</span><span class="info-value">${new Date(request.created_at).toLocaleString()}</span></div>
            <div class="info-row"><span class="info-label">Current Status</span><span class="info-value text-orange-600">${request.status}</span></div>
          </div>
          <div class="section">
            <h2 class="section-title">Requester & Priority</h2>
            <div class="info-row"><span class="info-label">Full Name</span><span class="info-value">${request.requested_by?.full_name || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Department</span><span class="info-value">${request.department?.name || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Urgency Level</span><span class="info-value" style="color:${request.urgency === 'CRITICAL' ? '#ef4444' : '#f59e0b'}">${request.urgency}</span></div>
            <div class="info-row"><span class="info-label">Verified By Finance</span><span class="info-value">${request.verified_by_finance?.full_name || 'PENDING'}</span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:30px">
          <h2 class="section-title">Line Items & Fulfillment</h2>
          <table>
            <thead>
              <tr><th style="width:60px;text-align:center">Qty</th><th>Description</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;margin-top:20px;padding:0 12px">
            <div style="text-align:right">
              <div class="label" style="font-size:9px;color:#94a3b8;font-weight:800;text-transform:uppercase">Grand Total Summary</div>
              <div style="font-size:24px;font-weight:900;color:#1e293b">${(request.financials?.grand_total || 0).toLocaleString()} RWF</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Audit Trail & Logistics</h2>
          <div class="info-row"><span class="info-label">Destination</span><span class="info-value">${request.logistics?.destination || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Recipient Contact</span><span class="info-value">${request.logistics?.contact_name} (${request.logistics?.contact_phone})</span></div>
          <div class="info-row"><span class="info-label">System Audit Result</span><span class="info-value">AUTHENTICATED TRACE</span></div>
        </div>

        <div class="footer">
          <p>This document is a system-generated audit report from HISP Rwanda Asset Management System.</p>
          <p style="margin-top:4px;font-weight:700">Digital Identity: HISP-AMS-AUDIT-${request.id.slice(0, 12)}</p>
        </div>

        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <button
          onClick={() => navigate('/audit-trail')}
          className="flex items-center gap-2 text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform w-fit"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1 px-2 rounded-lg border border-white shadow-sm">
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
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="ml-1 p-1 hover:bg-white rounded-md transition-colors"
              >
                <X className="w-3 h-3 text-rose-400" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportLogs}
            disabled={!filteredRequests.length}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" /> Request log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm h-full">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              Total Logs
            </p>
            <p className="text-lg font-black text-slate-800 leading-none">
              {filteredRequests.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm h-full">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              Fulfilled
            </p>
            <p className="text-lg font-black text-slate-800 leading-none">
              {filteredRequests.filter((r) => r.status === 'FULFILLED').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <X className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                Rejected
              </p>
              <p className="text-lg font-black text-slate-800 leading-none">
                {filteredRequests.filter((r) => r.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-slate-100 p-1.5 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group pl-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, department, or requester..."
            className="w-full bg-transparent border-none pl-9 pr-4 py-1.5 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar sm:pr-2">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
            <Filter className="w-4 h-4 text-[#ff8000]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Status:
            </span>
          </div>
          <div className="flex gap-1">
            {['ALL', 'PENDING', 'APPROVED', 'FULFILLED', 'REJECTED'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${filterStatus === status ? 'bg-orange-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-orange-600'}`}
                >
                  {status}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Request Item
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Requested By
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total Est. Cost
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Urgency
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-12 text-center text-slate-400 font-bold italic"
                  >
                    Loading logs...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-12 text-center text-slate-400 font-bold italic"
                  >
                    No requests match your current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/40 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">
                          {req.title}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{' '}
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                          <User className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700">
                            {req.requested_by?.full_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {req.department?.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-black text-slate-800">
                          {(
                            req.financials?.grand_total ||
                            req.estimated_unit_cost ||
                            0
                          ).toLocaleString()}{' '}
                          RWF
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          req.urgency === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : req.urgency === 'HIGH'
                              ? 'bg-orange-50 text-orange-600 border-orange-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          req.status === 'FULFILLED'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handlePrintAuditSummary(req)}
                        className="p-2 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                        title="View Audit Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
