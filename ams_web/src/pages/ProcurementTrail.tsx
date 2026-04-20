import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Printer,
  Building2,
  Calendar,
  Banknote,
  Search,
  ArrowLeft,
  History,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AssetRequest } from '../types/assets';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ConfirmActionModal } from '../components/ConfirmActionModal';

export const ProcurementTrail = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const { isAdmin, isFinanceAdmin, isCEO } = useAuth();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Procurement Archive');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: requests, isLoading } = useQuery<AssetRequest[]>({
    queryKey: ['assets-requests'],
    queryFn: async () => {
      const response = await api.get('/assets-requests');
      return response.data;
    },
  });

  const poRequests = useMemo(() => {
    if (!requests) return [];
    let filtered = requests.filter((r) => r.purchase_order);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.purchase_order?.po_number?.toLowerCase().includes(q) ||
          r.purchase_order?.vendor_details?.toLowerCase().includes(q),
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
  }, [requests, searchQuery, startDate, endDate]);

  const handlePrintPO = (request: AssetRequest) => {
    const po = request.purchase_order;
    if (!po) return;

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
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700">${item.name}${item.description ? `<br/><span style="font-size:10px;color:#94a3b8;font-weight:400">${item.description}</span>` : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${item.unit_price.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800">${(item.quantity * item.unit_price).toLocaleString()}</td>
      </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order - ${po.po_number}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 12px; }
          h1 { text-align: center; font-size: 24px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 9px; color: #ff8000; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 30px; }
          .section-header { background: #fff7ed; color: #ff8000; font-size: 9px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; padding: 6px 12px; border: 1px solid #ffedd5; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
          .label { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
          .value { font-size: 12px; font-weight: 700; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          thead { background: #f1f5f9; }
          th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #64748b; }
          th:last-child, td:last-child { text-align: right; }
          th:first-child, td:first-child { text-align: center; }
          .total-row { background: #ff8000; color: white; font-weight: 900; }
          .total-row td { padding: 14px 12px; font-size: 14px; }
          .sign-line { border-bottom: 1px solid #cbd5e1; height: 36px; margin-top: 8px; }
          .footer { margin-top: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 9px; color: #64748b; text-align: center; line-height: 1.6; }
          .footer strong { color: #ff8000; }
        </style>
      </head>
      <body>
        <h1>Purchase Order</h1>
        <p class="subtitle">HISP Rwanda Organization</p>

        <div class="grid-2">
          <div>
            <div class="section-header">Issued To (Vendor)</div>
            <div class="box" style="min-height:90px">
              <div class="value" style="white-space:pre-wrap">${po.vendor_details || '—'}</div>
            </div>
          </div>
          <div class="box" style="display:flex;flex-direction:column;gap:10px">
            <div><div class="label">Order Date</div><div class="value">${po.order_date}</div></div>
            <div><div class="label">Purchase Order #</div><div class="value">${po.po_number}</div></div>
            <div><div class="label">Payment Terms</div><div class="value">${po.payment_terms || '—'}</div></div>
          </div>
        </div>

        <div class="grid-3" style="margin-bottom:24px">
          <div>
            <div class="section-header">Special Instructions</div>
            <div class="box" style="min-height:70px"><div class="value">${po.special_instructions || '—'}</div></div>
          </div>
          <div>
            <div class="section-header">Bill To</div>
            <div class="box" style="min-height:70px">
              <div class="value">HISP Rwanda Ltd</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px">TIN: 103036818</div>
            </div>
          </div>
          <div>
            <div class="section-header">Ship To / Deliver To</div>
            <div class="box" style="min-height:70px">
              <div class="value">HISP Rwanda LTD</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px">Kimihurura/Rugando/KG 6 Avenue/ Plot 49<br>0784506828 / 0788620185</div>
            </div>
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px">
          <table>
            <thead><tr><th>Qty</th><th>Item Name / Service</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="background:#f8fafc;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0">
            <span style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8">Total Approved Value</span>
            <span style="font-size:16px;font-weight:900">${(po.grand_total - (po.shipping_cost || 0) - (po.other_cost || 0)).toLocaleString()} RWF</span>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:20px">
          <div>
            <div class="section-header">Period of Performance</div>
            <div class="box"><div class="value">${po.period_of_performance || '—'}</div></div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="padding:8px 12px;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0">
              <span class="label" style="margin:0">Shipping</span><span style="font-weight:700">${(po.shipping_cost || 0).toLocaleString()} RWF</span>
            </div>
            <div style="padding:8px 12px;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0">
              <span class="label" style="margin:0">Other</span><span style="font-weight:700">${(po.other_cost || 0).toLocaleString()} RWF</span>
            </div>
            <div style="padding:12px;display:flex;justify-content:space-between;align-items:center;background:#ff8000">
              <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:white">TOTAL</span>
              <span style="font-size:18px;font-weight:900;color:white">${(po.grand_total || 0).toLocaleString()} RWF</span>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <div class="section-header">For HISP — Authorized Signatory</div>
            <div class="box">
              <div class="label">Name &amp; Title</div><div class="value">${po.hisp_sign_name || '—'}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div><div class="label">Signature</div><div class="sign-line"></div></div>
                <div><div class="label">Date</div><div class="value" style="margin-top:8px">${po.hisp_sign_date || ''}</div></div>
              </div>
            </div>
          </div>
          <div>
            <div class="section-header">For Vendor — Acceptance</div>
            <div class="box">
              <div class="label">Name &amp; Title</div><div class="value">${po.vendor_sign_name || '—'}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div><div class="label">Signature</div><div class="sign-line"></div></div>
                <div><div class="label">Date</div><div class="value" style="margin-top:8px">${po.vendor_sign_date || '—'}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Financial commitment is only established upon mutual signature of this Purchase Order by both HISP and the vendor.</p>
          <p style="margin-top:8px"><strong>HISP ANTI-BRIBERY ZERO TOLERANCE:</strong> Staff are strictly prohibited from receiving any form of motivation or gifts from vendors. Report violations to contact@hisprwanda.org</p>
        </div>

        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportLogs = () => {
    if (!startDate && !endDate) {
      setShowExportConfirm(true);
    } else {
      executeDownload();
    }
  };

  const executeDownload = () => {
    if (!poRequests.length) return;

    const headers = [
      'PO Number',
      'Vendor Details',
      'Original Requisition',
      'Total Value (RWF)',
      'Status',
      'Date Ordered',
    ];

    const escapeCSV = (val: string | number | undefined) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = poRequests.map((req) => {
      return [
        escapeCSV(req.purchase_order?.po_number),
        escapeCSV(req.purchase_order?.vendor_details?.replace(/\n/g, ' ')),
        escapeCSV(req.title),
        escapeCSV(req.purchase_order?.grand_total),
        escapeCSV(req.status),
        escapeCSV(req.purchase_order?.order_date),
      ];
    });

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
    const filename =
      startDate && endDate
        ? `procurement_archive_${startDate}_to_${endDate}.csv`
        : `procurement_archive_full_export_${dateStr}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportConfirm(false);
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

          <div className="w-px h-4 bg-slate-200 mx-1" />

          {(isAdmin || isFinanceAdmin || isCEO) && (
            <button
              onClick={handleExportLogs}
              disabled={!poRequests.length}
              className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-[#ff8000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Download CSV Export"
            >
              <History className="w-3.5 h-3.5 text-[#ff8000]" /> Procurement log
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-2 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search POs, vendors, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none pl-10 pr-4 py-2 rounded-xl text-sm font-medium focus:ring-0 outline-none transition-all w-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  PO Number
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Vendor Details
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Original Requisition
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total Value
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
                    className="px-8 py-12 text-center text-slate-400 font-bold"
                  >
                    Loading procurement logs...
                  </td>
                </tr>
              ) : poRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-12 text-center text-slate-400 font-bold"
                  >
                    No purchase orders found in the archive.
                  </td>
                </tr>
              ) : (
                poRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/40 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">
                          {req.purchase_order?.po_number}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {req.purchase_order?.order_date}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                          <Building2 className="w-4 h-4 text-[#ff8000]" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[180px]">
                          {req.purchase_order?.vendor_details?.split('\n')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">
                          {req.title}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 italic">
                          Requested by {req.requested_by?.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        {req.purchase_order?.grand_total?.toLocaleString()} RWF
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          req.status === 'FULFILLED'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-orange-50 text-[#ff8000] border-orange-100'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handlePrintPO(req)}
                        className="p-2 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                        title="Download Purchase Order"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-auto px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            TOTAL ARCHIVED INSTRUMENTS: {poRequests.length}
          </span>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Digital Trace Verified
            </p>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={executeDownload}
        title="Confirm Full Archive Export"
        message="You haven't selected a specific audit period. This will export the entire Procurement Archive. This may take a few moments depending on the volume of data."
        confirmText="Proceed with Full Export"
        variant="warning"
      />
    </div>
  );
};
