import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Calendar,
  User,
  Laptop,
  MessageSquare,
  FileText,
  Clock,
  Download,
} from 'lucide-react';
import { AssetIncident } from '../types/assets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface ViewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: AssetIncident | null;
}

export const ViewIncidentModal = ({
  isOpen,
  onClose,
  incident,
}: ViewIncidentModalProps) => {
  if (!incident) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          icon: ShieldCheck,
          color: 'text-orange-950',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          label: 'Investigation Resolved - Accepted',
        };
      case 'DENIED':
        return {
          icon: ShieldX,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-100',
          label: 'Investigation Resolved - Denied',
        };
      default:
        return {
          icon: Clock,
          color: 'text-amber-500',
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          label: 'Investigation In Progress',
        };
    }
  };

  const status = getStatusConfig(incident.investigation_status);
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="sm:max-w-[550px] bg-white border-white/20 shadow-2xl rounded-2xl overflow-hidden p-0 gap-0"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl ${status.bg} flex items-center justify-center border ${status.border} shadow-sm shrink-0 transition-all`}
              >
                <StatusIcon className={`w-6 h-6 ${status.color}`} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  #{incident.id.slice(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                  {incident.incident_type} INCIDENT REPORT
                </DialogDescription>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl border ${status.border} ${status.bg} ${status.color} text-[9px] font-semibold uppercase tracking-widest shadow-sm`}
            >
              {incident.investigation_status}
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Reporter
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {incident.reported_by?.full_name}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Reported Date
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {new Date(incident.reported_at).toLocaleDateString(
                    undefined,
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    },
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5" /> Affected Asset
            </h4>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-400 border border-orange-100 shadow-inner">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-sm">
                    {incident.asset?.name || 'Legacy Asset'}
                  </span>
                  <span className="text-[9px] font-semibold text-[#ff8000] uppercase tracking-widest">
                    {incident.asset?.tag_id || 'NO TAG'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-300 block mb-1">
                  SERIAL NUMBER
                </span>
                <span className="text-[10px] font-semibold text-slate-600 font-mono tracking-tighter">
                  {incident.asset?.serial_number || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Reporter Explanation
            </h4>
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden italic shadow-inner">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-200" />
              <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                "{incident.explanation || 'No explanation provided'}"
              </p>
              {incident.evidence_url && (
                <div className="mt-4 pt-4 border-t border-slate-200/60 not-italic">
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                    Uploaded Photo Evidence
                  </p>
                  {incident.evidence_url.startsWith('data:image/') ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white w-max max-w-[200px] shadow-sm">
                      <img
                        src={incident.evidence_url}
                        alt="Evidence"
                        className="object-cover max-h-32"
                      />
                      <a
                        href={incident.evidence_url}
                        download={`evidence-${incident.id}`}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white font-bold text-[10px] uppercase"
                      >
                        <Download className="w-4 h-4 mr-1.5" /> Save Photo
                      </a>
                    </div>
                  ) : incident.evidence_url.startsWith('data:') ? (
                    <a
                      href={incident.evidence_url}
                      download={`evidence-${incident.id}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Download Attachment
                    </a>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                        <ShieldAlert className="w-3 h-3" /> Legacy Link
                        (Unreachable)
                      </div>
                      <p className="text-[8px] text-slate-400 font-medium ml-1">
                        This report was created before the storage system
                        update.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {(incident.investigation_remarks ||
            incident.investigation_status !== 'INVESTIGATING') && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Investigation Audit Trail
              </h4>
              <div className="space-y-3">
                {/* Admin Findings */}
                <div
                  className={`p-5 bg-white border border-slate-200 rounded-2xl relative shadow-sm border-l-4 border-l-slate-400`}
                >
                  <p
                    className={`text-[9px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-2`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Administrative
                    Findings
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {parseAdminRemarks(incident.investigation_remarks) ||
                      'The initial investigation was completed by the administration.'}
                  </p>
                </div>

                {/* CEO Verdict (if exists) */}
                {incident.investigation_remarks?.includes('CEO:') && (
                  <div
                    className={`p-5 ${status.bg} border-2 ${status.border} rounded-2xl relative shadow-sm border-l-4 border-l-orange-500`}
                  >
                    <p
                      className={`text-[9px] ${status.color} font-semibold uppercase tracking-widest mb-2 flex items-center gap-2`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Executive
                      Strategic Review
                    </p>
                    <p className="text-[11px] font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap italic">
                      "
                      {parseCEORemarks(incident.investigation_remarks) ||
                        'Final decision rendered.'}
                      "
                    </p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${status.bg} border ${status.border}`}
                      />
                      <span className="text-[9px] font-bold text-slate-400">
                        FINAL VERDICT RENDERED
                      </span>
                    </div>
                  </div>
                )}

                {/* Penalty Details */}
                {incident.investigation_status === 'DENIED' && (
                  <div
                    className={`p-5 ${incident.penalty_resolved_at ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'} border-2 rounded-2xl relative shadow-sm border-l-4 ${incident.penalty_resolved_at ? 'border-l-emerald-500' : 'border-l-orange-500'} mt-4`}
                  >
                    <p
                      className={`text-[9px] ${incident.penalty_resolved_at ? 'text-emerald-600' : 'text-orange-600'} font-semibold uppercase tracking-widest mb-2 flex items-center gap-2`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Financial Penalty
                      Details
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-semibold text-slate-900">
                          {Number(
                            incident.penalty_amount || 0,
                          ).toLocaleString()}{' '}
                          RWF
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Assessed Penalty Amount
                        </p>
                      </div>
                      <span
                        className={`text-[8px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${incident.penalty_resolved_at ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}
                      >
                        {incident.penalty_resolved_at
                          ? `CLEARED ON ${new Date(incident.penalty_resolved_at).toLocaleDateString()}`
                          : 'PENDING PAYMENT'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
          >
            Close Details
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const parseAdminRemarks = (remarks?: string) => {
  if (!remarks) return '';
  if (remarks.includes('ADMIN:')) {
    return remarks.split('ADMIN:')[1]?.split('CEO:')[0]?.trim() || remarks;
  }
  return remarks;
};

const parseCEORemarks = (remarks?: string) => {
  if (!remarks || !remarks.includes('CEO:')) return '';
  return remarks.split('CEO:')[1]?.trim() || '';
};
