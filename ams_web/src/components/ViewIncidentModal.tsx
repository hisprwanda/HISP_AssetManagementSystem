import {
  ShieldCheck,
  ShieldX,
  Calendar,
  User,
  Laptop,
  MessageSquare,
  FileText,
  Clock,
  Hammer,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
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
      case 'RESOLVED_FIXED':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          label: 'Repaired & Returned',
        };
      case 'RESOLVED_REPLACED':
        return {
          icon: CheckCircle2,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Unfixable - Replaced',
        };
      case 'REJECTED_LIABILITY':
        return {
          icon: ShieldX,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Denied - Staff Liability',
        };
      case 'IN_REPAIR':
        return {
          icon: Hammer,
          color: 'text-blue-500',
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          label: 'Currently In Repair',
        };
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
          label: 'Awaiting Review',
        };
    }
  };

  const status = getStatusConfig(
    incident.status || incident.investigation_status || 'PENDING',
  );
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
              {status.label}
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
                  {new Date(incident.reported_at).toLocaleDateString()}
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
              <MessageSquare className="w-3.5 h-3.5" /> Issue Description
            </h4>
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden italic shadow-inner">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-200" />
              <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                "
                {incident.issue_description ||
                  incident.explanation ||
                  'No explanation provided'}
                "
              </p>
            </div>
          </div>

          {incident.ceo_remarks && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Admin Preliminary Remarks
              </h4>
              <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl relative shadow-sm border-l-4 border-l-blue-400">
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                  "{incident.ceo_remarks}"
                </p>
              </div>
            </div>
          )}

          {incident.evidence_url && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" /> Photo Evidence
              </h4>
              <div className="relative group rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                <img
                  src={incident.evidence_url}
                  alt="Incident Evidence"
                  className="w-full h-auto max-h-[300px] object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/600x400?text=Evidence+Image+Unavailable';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-[10px] text-white font-medium">
                    Evidence captured on{' '}
                    {new Date(incident.reported_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(incident.resolution_notes || incident.investigation_remarks) && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Resolution Details
              </h4>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl relative shadow-sm border-l-4 border-l-slate-400">
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mb-2">
                  Technical Resolution / Verdict
                </p>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {incident.resolution_notes || incident.investigation_remarks}
                </p>
              </div>
            </div>
          )}

          {incident.penalty_amount &&
            incident.status === 'REJECTED_LIABILITY' && (
              <div className="p-5 bg-red-50 border-2 border-red-100 rounded-2xl relative shadow-sm border-l-4 border-l-red-500">
                <p className="text-[9px] text-red-600 font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Financial Penalty
                  Applied
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">
                      {Number(incident.penalty_amount).toLocaleString()} RWF
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Assessed Penalty Amount
                    </p>
                  </div>
                  <span
                    className={`text-[8px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${incident.penalty_resolved_at ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {incident.penalty_resolved_at ? 'CLEARED' : 'PENDING'}
                  </span>
                </div>
              </div>
            )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            Close Details
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
