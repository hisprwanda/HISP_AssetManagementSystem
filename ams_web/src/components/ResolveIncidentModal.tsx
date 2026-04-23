import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  CheckCircle2,
  Send,
  AlertCircle,
  MessageSquare,
  Hammer,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { AssetIncident } from '../types/assets';
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

type Outcome = 'RESOLVED_FIXED' | 'RESOLVED_REPLACED' | 'REJECTED_LIABILITY';

export const ResolveIncidentModal = ({
  isOpen,
  onClose,
  incident,
}: ResolveIncidentModalProps) => {
  const queryClient = useQueryClient();

  const [outcome, setOutcome] = useState<Outcome>('RESOLVED_FIXED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async (payload: {
      incident_status: string;
      resolution_notes: string;
      new_asset_status: string;
    }) => {
      const response = await api.patch(
        `/asset-incidents/${incident.id}/resolve`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
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

  const startRepairMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/asset-incidents/${incident.id}/start-repair`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes.');
      return;
    }

    let newAssetStatus = 'ASSIGNED';
    if (outcome === 'RESOLVED_REPLACED' || outcome === 'REJECTED_LIABILITY') {
      newAssetStatus = 'DISPOSED';
    }

    mutation.mutate({
      incident_status: outcome,
      resolution_notes: resolutionNotes,
      new_asset_status: newAssetStatus,
    });
  };

  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] overflow-hidden p-0 gap-0">
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 border bg-emerald-50 border-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-2 uppercase tracking-widest">
              Resolution Logged
            </h2>
            <p className="text-slate-500 font-medium px-8 text-xs">
              The ticket has been resolved and the asset status has been
              updated.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm shrink-0">
                  <Hammer className="w-5 h-5 text-[#ff8000]" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-slate-800 tracking-tight">
                    IT Helpdesk Resolution
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-[10px]">
                    Ticket{' '}
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
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 text-[10px] font-semibold uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                      Reporter
                    </p>
                    <p className="text-[10px] font-semibold text-slate-700 truncate">
                      {incident.reported_by?.full_name}
                    </p>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                      Asset Tag
                    </p>
                    <p className="text-[10px] font-semibold text-slate-700 truncate">
                      {incident.asset?.tag_id}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 mt-2">
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Issue Description
                  </p>
                  <p className="text-xs font-medium text-slate-600 bg-white/60 p-2.5 rounded-lg border border-slate-200/50 leading-relaxed italic">
                    "{incident.issue_description || incident.explanation}"
                  </p>
                </div>
              </div>

              {incident.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => startRepairMutation.mutate()}
                  className="w-full py-2 bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  Move to In-Repair Status
                </button>
              )}

              <div className="space-y-3">
                <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                  Resolution Outcome
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'RESOLVED_FIXED',
                      label: 'Repaired & Return to User',
                      icon: RotateCcw,
                      color: 'emerald',
                      sub: 'Asset remains ASSIGNED',
                    },
                    {
                      id: 'RESOLVED_REPLACED',
                      label: 'Unfixable (Company Loss)',
                      icon: Trash2,
                      color: 'orange',
                      sub: 'Asset DISPOSED + New Request',
                    },
                    {
                      id: 'REJECTED_LIABILITY',
                      label: 'Negligence (Staff Liability)',
                      icon: ShieldAlert,
                      color: 'red',
                      sub: 'Asset DISPOSED + Penalty Fee',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOutcome(opt.id as Outcome)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                        outcome === opt.id
                          ? `bg-${opt.color}-50 border-${opt.color}-500/30 shadow-sm`
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          outcome === opt.id
                            ? `bg-${opt.color}-500 text-white shadow-md`
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-widest ${outcome === opt.id ? `text-${opt.color}-900` : 'text-slate-500'}`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5 uppercase tracking-tighter">
                          {opt.sub}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                  Resolution Notes
                </h4>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe the technical resolution or findings..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[11px] font-bold min-h-[80px] focus:ring-2 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none"
                    required
                  />
                </div>
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
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={mutation.isPending || !resolutionNotes.trim()}
                className="flex-1 px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-black text-white shadow-lg transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Finalize Resolution
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
