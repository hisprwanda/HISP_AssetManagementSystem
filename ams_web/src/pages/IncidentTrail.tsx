import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Eye,
  User as UserIcon,
  Laptop,
  ArrowLeft,
  Printer,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetIncident } from '../types/assets';
import { ViewIncidentModal } from '../components/ViewIncidentModal';

export const IncidentTrail = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [incidentToView, setIncidentToView] = useState<AssetIncident | null>(
    null,
  );

  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Incident Trail');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: incidents, isLoading } = useQuery<AssetIncident[]>({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
  });

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    let result = incidents;

    if (filterType !== 'ALL') {
      result = result.filter((i) => i.incident_type === filterType);
    }

    if (filterStatus !== 'ALL') {
      result = result.filter((i) => i.investigation_status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.asset?.name?.toLowerCase().includes(q) ||
          i.reported_by?.full_name?.toLowerCase().includes(q) ||
          i.explanation?.toLowerCase().includes(q),
      );
    }

    if (startDate) {
      result = result.filter(
        (i) => new Date(i.reported_at) >= new Date(startDate),
      );
    }

    if (endDate) {
      result = result.filter((i) => {
        const date = new Date(i.reported_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date <= end;
      });
    }

    return result.sort(
      (a, b) =>
        new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime(),
    );
  }, [incidents, filterType, filterStatus, searchQuery, startDate, endDate]);

  const handlePrintIncident = (inc: AssetIncident) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date(inc.reported_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <html>
        <head>
          <title>Incident Report - #${inc.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 40px; 
              color: #1e293b;
              line-height: 1.5;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 4px solid #ff8000; 
              padding-bottom: 20px; 
              margin-bottom: 40px; 
            }
            .logo-section h1 { margin: 0; font-size: 24px; font-weight: 900; color: #ff8000; }
            .logo-section p { margin: 0; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            .report-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px; text-align: center; }
            
            .section { margin-bottom: 30px; }
            .section-title { 
              font-size: 10px; 
              font-weight: 900; 
              text-transform: uppercase; 
              color: #ff8000; 
              border-bottom: 1px solid #e2e8f0; 
              padding-bottom: 5px; 
              margin-bottom: 15px; 
            }
            
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 15px; }
            .info-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
            .info-value { font-size: 13px; font-weight: 700; color: #334155; }
            
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; rounded: 10px; }
            .explanation { font-style: italic; color: #475569; }
            
            .outcome-box { 
              border: 2px solid ${inc.investigation_status === 'ACCEPTED' ? '#10b981' : inc.investigation_status === 'DENIED' ? '#ef4444' : '#f59e0b'};
              background: ${inc.investigation_status === 'ACCEPTED' ? '#f0fdf4' : inc.investigation_status === 'DENIED' ? '#fef2f2' : '#fffbeb'};
              padding: 24px;
              border-radius: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 99px;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              background: #fff;
              border: 1px solid #e2e8f0;
              margin-bottom: 10px;
            }

            .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print {
              button { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <h1>HISP-AMS</h1>
              <p>Asset Management System • Investigation Trail</p>
            </div>
            <div style="text-align: right">
              <p style="margin:0; font-weight:900; font-size: 14px;">#${inc.id.slice(0, 8).toUpperCase()}</p>
              <p style="margin:0; font-size:10px; color:#94a3b8;">${dateStr}</p>
            </div>
          </div>

          <div class="report-title">Incident Investigation Report</div>

          <div class="section">
            <div class="section-title">Incident Information</div>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">Type of Incident</div>
                <div class="info-value">${inc.incident_type}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Reported By</div>
                <div class="info-value">${inc.reported_by?.full_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">${inc.reported_by?.department?.name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Reference ID</div>
                <div class="info-value">${inc.id}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Asset Specification</div>
            <div class="box">
              <div class="grid">
                <div class="info-item">
                  <div class="info-label">Asset Name</div>
                  <div class="info-value">${inc.asset?.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Tag ID / Serial</div>
                  <div class="info-value">${inc.asset?.tag_id || 'N/A'} • ${inc.asset?.serial_number || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Reporter's Statement</div>
            <div class="box explanation">
              "${inc.explanation || 'No statement provided.'}"
            </div>
          </div>

          <div class="section">
            <div class="section-title">Investigation Outcome</div>
            <div class="outcome-box">
              <div class="status-badge">${inc.investigation_status}</div>
              <div class="info-value" style="margin-bottom: 8px;">Final Resolution:</div>
              <div style="font-size: 13px; font-weight: 500; color: #475569;">
                ${inc.investigation_remarks || 'The investigation is currently finalized with the status shown above.'}
              </div>
              <div style="margin-top: 24px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">
                Certified Investigation Record • ${new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          <div class="footer">
            Generated by HISP-AMS Admin Audit Portal<br>
            Official Internal Document • Non-Transferable
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <div>
          <button
            onClick={() => navigate('/audit-trail')}
            className="flex items-center gap-2 text-[10px] font-black text-[#ff8000] uppercase tracking-widest mb-2 hover:translate-x-1 transition-transform"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
          </button>
        </div>
        <div className="flex bg-white/60 backdrop-blur-md p-1 px-4 rounded-xl border border-white shadow-sm items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Period:
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
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-2 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident trail by asset, personnel, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none pl-12 pr-4 py-2 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Types</option>
            <option value="BROKEN">Broken</option>
            <option value="MISSING">Missing</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#ff8000]/20"
          >
            <option value="ALL">All Status</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DENIED">Denied</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Date Reported
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Reporter
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Asset
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Incident Details
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Outcome
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Certificate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-32 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]"
                  >
                    Compiling Incident Records...
                  </td>
                </tr>
              )}
              {!isLoading &&
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700">
                          {new Date(inc.reported_at).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                          {new Date(inc.reported_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">
                            {inc.reported_by?.full_name}
                          </span>
                          <span className="text-[9px] font-black text-[#ff8000] uppercase tracking-widest mt-0.5">
                            {inc.reported_by?.department?.name || 'CENTRAL'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#ff8000] border border-orange-100">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">
                            {inc.asset?.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {inc.asset?.tag_id || inc.asset?.serial_number}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex self-start px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            inc.incident_type === 'BROKEN'
                              ? 'bg-orange-50 text-orange-600 border-orange-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}
                        >
                          {inc.incident_type}
                        </span>
                        <p className="text-[10px] font-bold text-slate-500 line-clamp-2 italic leading-relaxed">
                          "{inc.explanation}"
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex self-start px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            inc.investigation_status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : inc.investigation_status === 'DENIED'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}
                        >
                          {inc.investigation_status}
                        </span>
                        {inc.investigation_remarks && (
                          <p
                            className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[120px]"
                            title={inc.investigation_remarks}
                          >
                            Outcome: {inc.investigation_remarks}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIncidentToView(inc)}
                          className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="View Full Report"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handlePrintIncident(inc)}
                          className="p-2 text-slate-300 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                          title="Print Audit Certificate"
                        >
                          <Printer className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {(!incidents || filteredIncidents.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <ShieldAlert className="w-12 h-12 text-slate-100 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                        No Historical Incidents Found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewIncidentModal
        isOpen={!!incidentToView}
        onClose={() => setIncidentToView(null)}
        incident={incidentToView}
      />
    </div>
  );
};
