import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertCircle,
  Camera,
  Send,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Asset } from '../types/assets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface ReportAssetIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportAssetIncidentModal = ({
  isOpen,
  onClose,
}: ReportAssetIncidentModalProps) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assetId, setAssetId] = useState('');
  const [type, setType] = useState('BROKEN');
  const [explanation, setExplanation] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch only assets assigned to the current user
  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const myAssets =
    assets?.filter(
      (a: Asset) =>
        a.assigned_to?.id === currentUser?.id && a.status === 'ASSIGNED',
    ) || [];

  const mutation = useMutation({
    mutationFn: async (payload: {
      asset_id: string;
      user_id: string;
      type: string;
      explanation: string;
      evidence_url?: string;
    }) => {
      const response = await api.post('/asset-incidents/report', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || 'Failed to submit report.',
      );
    },
  });

  const resetForm = () => {
    setAssetId('');
    setType('BROKEN');
    setExplanation('');
    setEvidenceUrl('');
    setSelectedFile(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Simulate an upload URL for now since we don't have a storage backend yet
      setEvidenceUrl(
        `https://storage.ams.rw/evidence/${e.target.files[0].name}`,
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !explanation) {
      setError('Please select an asset and provide an explanation.');
      return;
    }

    const payload = {
      asset_id: assetId,
      user_id: currentUser?.id || '',
      type,
      explanation,
      evidence_url: evidenceUrl || undefined,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] max-h-[95vh] overflow-y-auto">
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-[#ff8000]" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              Report Logged!
            </h2>
            <p className="text-slate-500 font-medium px-8 text-sm">
              Your incident report has been submitted to the Administration and
              Finance unit for further investigation.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-[#ff8000]" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-800 tracking-tight leading-none">
                    Report Issue / Incident
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-xs mt-1.5">
                    Log a problem with your assigned equipment. This will
                    initiate an internal review.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-3">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Select Affected Asset *
                </label>
                <div className="relative">
                  <Laptop className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all appearance-none"
                    required
                  >
                    <option value="">Choose an equipment...</option>
                    {myAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Incident Type *
                </label>
                <div className="flex gap-2">
                  {['BROKEN', 'MISSING'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase border transition-all ${
                        type === t
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t === 'BROKEN' ? 'Damage / Broken' : 'Missing / Stolen'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Explain what happened *
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all min-h-[85px] resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Evidence (Optional)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                    selectedFile
                      ? 'bg-orange-50 border-[#ff8000]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <div
                    className={`p-2 rounded-lg ${selectedFile ? 'bg-[#ff8000] text-white' : 'bg-white text-slate-400 shadow-sm border border-slate-100'}`}
                  >
                    {selectedFile ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${selectedFile ? 'text-slate-800' : 'text-slate-500'}`}
                    >
                      {selectedFile ? selectedFile.name : 'Upload proof'}
                    </p>
                    {!selectedFile && (
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                        JPEG, PNG, or PDF max 5MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-100 transition-colors text-xs"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                >
                  {mutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      Submit Final Report
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
