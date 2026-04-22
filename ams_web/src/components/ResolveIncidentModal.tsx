import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  MessageSquare,
  Info,
  Download,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetIncident } from '../types/assets';
import { useAuth } from '../hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface ResolveIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: AssetIncident;
}

export const ResolveIncidentModal = ({
  isOpen,
  onClose,
  incident,
}: ResolveIncidentModalProps) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [resolution, setResolution] = useState<'ACCEPTED' | 'DENIED'>(
    'ACCEPTED',
  );
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isCEOReviewStatus = incident.investigation_status === 'CEO_REVIEW';

  const mutation = useMutation({
    mutationFn: async (payload: { resolution: string; remarks: string }) => {
      const endpoint = isCEOReviewStatus
        ? `/asset-incidents/${incident.id}/ceo-resolve`
        : `/asset-incidents/${incident.id}/resolve`;
      const response = await api.patch(endpoint, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || 'Failed to resolve incident.',
      );
    },
  });

  const forwardMutation = useMutation({
    mutationFn: async () => {
      if (!remarks.trim())
        throw new Error(
          'Investigation findings are required before forwarding.',
        );
      const response = await api.patch(
        `/asset-incidents/${incident.id}/forward`,
        { remarks },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || 'Failed to forward incident.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Please provide findings/remarks.');
      return;
    }
    mutation.mutate({ resolution, remarks });
  };

  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] overflow-hidden p-0 gap-0">
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 border ${
                resolution === 'ACCEPTED'
                  ? 'bg-orange-50 border-orange-100 text-orange-950'
                  : 'bg-orange-50 border-orange-100 text-orange-600'
              }`}
            >
              {resolution === 'ACCEPTED' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-2 uppercase tracking-widest">
              {forwardMutation.isSuccess ? 'Forwarded' : 'Logged'}
            </h2>
            <p className="text-slate-500 font-medium px-8 text-xs">
              {forwardMutation.isSuccess
                ? 'The incident has been forwarded to the CEO for strategic executive review.'
                : `The incident has been ${resolution.toLowerCase()} and the corresponding actions have been triggered.`}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm shrink-0">
                  <ShieldAlert className="w-5 h-5 text-[#ff8000]" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-slate-800 tracking-tight">
                    {isCEOReviewStatus
                      ? 'Strategic Executive Review'
                      : 'Investigation Resolution'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-[10px]">
                    Case{' '}
                    <span className="font-bold text-[#ff8000]">
                      #{incident.id.slice(0, 8).toUpperCase()}
                    </span>{' '}
                    • {incident.asset?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-2 text-orange-600 text-[10px] font-semibold uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                      Type
                    </p>
                    <p className="text-[10px] font-semibold text-slate-700 truncate">
                      {incident.incident_type}
                    </p>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex-[2] min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                      Reporter & Directorate
                    </p>
                    <p className="text-[10px] font-semibold text-slate-700 truncate flex items-center gap-1.5">
                      {incident.reported_by?.full_name}
                      <span className="text-[8px] text-[#ff8000] uppercase tracking-wider bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                        {incident.reported_by?.department?.name || 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>

                {isCEOReviewStatus && (
                  <div className="pt-3 border-t-2 border-amber-100 mt-2 bg-amber-50/30 p-3 rounded-lg border border-amber-100">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-[#ff8000] mb-1.5 flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3" /> Administrative
                      Findings
                    </p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                      {getAdminRemarks(incident)}
                    </p>
                  </div>
                )}

                {incident.explanation && (
                  <div className="pt-3 border-t border-slate-200/60 mt-2">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" /> Reporter Explanation
                    </p>
                    <p className="text-xs font-medium text-slate-600 bg-white/60 p-2.5 rounded-lg border border-slate-200/50 leading-relaxed italic">
                      "{incident.explanation}"
                    </p>
                  </div>
                )}

                {incident.evidence_url && (
                  <div className="pt-2 border-t border-slate-200/60 mt-2">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                      Photo Evidence
                    </p>
                    {incident.evidence_url.startsWith('data:image/') ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 w-max max-w-[200px]">
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
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Download Attachment
                      </a>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                          <AlertCircle className="w-3 h-3" /> Legacy Link
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

              <div className="space-y-2">
                <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                  Case Disposition
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolution('ACCEPTED')}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      resolution === 'ACCEPTED'
                        ? 'bg-emerald-50 border-emerald-500/30'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        resolution === 'ACCEPTED'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-widest ${resolution === 'ACCEPTED' ? 'text-orange-950' : 'text-slate-400'}`}
                      >
                        Accept Case
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 leading-none">
                        Replacement
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution('DENIED')}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      resolution === 'DENIED'
                        ? 'bg-orange-50 border-orange-500/30'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        resolution === 'DENIED'
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-widest ${resolution === 'DENIED' ? 'text-orange-600' : 'text-slate-400'}`}
                      >
                        Deny Case
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 leading-none">
                        Deduct Penalty
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                  {isCEOReviewStatus
                    ? 'Executive Verdict'
                    : 'Administrative Findings'}
                </h4>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      isCEOReviewStatus
                        ? 'Provide the final executive decision...'
                        : 'Enter detailed investigation findings...'
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[11px] font-bold min-h-[80px] focus:ring-2 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none"
                    required
                  />
                </div>
                {resolution === 'DENIED' && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <Info className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-orange-700 leading-relaxed uppercase tracking-tighter">
                      Penalty Application: The asset's current value will be
                      billed to the reporter.
                    </p>
                  </div>
                )}
              </div>
            </form>

            <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-[10px] uppercase text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              {!isCEOReviewStatus && isAdmin && (
                <button
                  type="button"
                  onClick={() => forwardMutation.mutate()}
                  disabled={forwardMutation.isPending || !remarks.trim()}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-lg transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {forwardMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Forward to CEO
                    </>
                  )}
                </button>
              )}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={mutation.isPending || !remarks.trim()}
                className={`flex-1 px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-lg transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group ${
                  resolution === 'ACCEPTED'
                    ? 'bg-orange-950 hover:bg-orange-900 shadow-orange-100'
                    : 'bg-orange-600 hover:bg-orange-500 shadow-orange-100'
                } text-white`}
              >
                {mutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {isCEOReviewStatus ? 'Submit Verdict' : 'Finalize Log'}
                  </>
                )}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const getAdminRemarks = (incident: AssetIncident) => {
  if (!incident.investigation_remarks) return '';
  if (incident.investigation_remarks.includes('ADMIN:')) {
    const adminPart = incident.investigation_remarks
      .split('ADMIN:')[1]
      ?.split('CEO:')[0];
    return adminPart?.trim() || incident.investigation_remarks;
  }
  return incident.investigation_remarks;
};
