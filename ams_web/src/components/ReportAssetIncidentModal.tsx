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
  const { user: currentUser, isHOD, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [type, setType] = useState('BROKEN');
  const [location, setLocation] = useState('');
  const [explanation, setExplanation] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const myAssets = assets || [];

  const departmentAssets = myAssets.filter(
    (a) => a.department?.id === currentUser?.department?.id,
  );

  const individualAssets = departmentAssets.filter((a) => {
    const isMine = a.assigned_to?.id === currentUser?.id;
    const isIndividual = !a.is_shared;
    const isReportable = a.status === 'ASSIGNED' || a.status === 'IN_STOCK';

    if (isHOD || isAdmin) {
      return isIndividual && isReportable;
    }
    return isMine && isIndividual && a.status === 'ASSIGNED';
  });

  const sharedAssets = departmentAssets.filter((a) => {
    const isShared = a.is_shared;
    const isReportable = a.status === 'ASSIGNED' || a.status === 'IN_STOCK';

    if (isHOD || isAdmin) {
      return isShared && isReportable;
    }
    return isShared && a.assigned_to?.id === currentUser?.id;
  });

  const showShared = isHOD || isAdmin;

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const mutation = useMutation({
    mutationFn: async (payload: {
      asset_id: string;
      user_id: string;
      type: string;
      location: string;
      explanation: string;
      evidence_url?: string;
    }) => {
      const response = await api.post('/asset-incidents/report', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const resetForm = () => {
    setSelectedAssetIds([]);
    setType('BROKEN');
    setLocation('');
    setExplanation('');
    setEvidenceUrl('');
    setSelectedFile(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setIsReadingFile(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenceUrl(reader.result as string);
        setIsReadingFile(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0 || !location || !explanation) {
      setError(
        'Please select at least one asset, provide location and explanation.',
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      for (const assetId of selectedAssetIds) {
        await mutation.mutateAsync({
          asset_id: assetId,
          user_id: currentUser?.id || '',
          type,
          location,
          explanation,
          evidence_url: evidenceUrl || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
        setSuccess(false);
        setIsSubmitting(false);
      }, 2000);
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ||
          'Failed to submit one or more reports.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[550px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] max-h-[95vh] overflow-y-auto">
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

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Select Affected Assets *
                </label>

                <div
                  className={`grid grid-cols-1 ${showShared ? 'sm:grid-cols-2' : ''} gap-4`}
                >
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight ml-1 flex items-center gap-1.5 line-clamp-1">
                      <div className="w-1 h-1 rounded-full bg-[#ff8000]" />
                      My Assigned Assets
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden min-h-[140px] max-h-[200px] overflow-y-auto custom-scrollbar shadow-inner">
                      {individualAssets.length > 0 ? (
                        individualAssets.map((asset) => (
                          <label
                            key={asset.id}
                            className={`flex items-start gap-2.5 p-2.5 cursor-pointer transition-colors hover:bg-white border-b border-slate-100 last:border-0 ${
                              selectedAssetIds.includes(asset.id)
                                ? 'bg-orange-50/50'
                                : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-[#ff8000] focus:ring-[#ff8000]/20"
                              checked={selectedAssetIds.includes(asset.id)}
                              onChange={() => toggleAsset(asset.id)}
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-700 truncate">
                                {asset.name}
                              </p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                {asset.tag_id}
                              </p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center opacity-40">
                          <Laptop className="w-6 h-6 mb-2 text-slate-300" />
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                            No Assigned Equipment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {showShared && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight ml-1 flex items-center gap-1.5 line-clamp-1">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        Shared Dept Assets
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden min-h-[140px] max-h-[200px] overflow-y-auto custom-scrollbar shadow-inner">
                        {sharedAssets.length > 0 ? (
                          sharedAssets.map((asset) => (
                            <label
                              key={asset.id}
                              className={`flex items-start gap-2.5 p-2.5 cursor-pointer transition-colors hover:bg-white border-b border-slate-100 last:border-0 ${
                                selectedAssetIds.includes(asset.id)
                                  ? 'bg-blue-50/30'
                                  : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                checked={selectedAssetIds.includes(asset.id)}
                                onChange={() => toggleAsset(asset.id)}
                              />
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-slate-700 truncate">
                                  {asset.name}
                                </p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {asset.tag_id}
                                </p>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center opacity-40">
                            <ShieldAlert className="w-6 h-6 mb-2 text-slate-300" />
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              No Shared Assets
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedAssetIds.length > 0 && (
                  <p className="text-[9px] font-black text-[#ff8000] uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                    Selected {selectedAssetIds.length} item
                    {selectedAssetIds.length > 1 ? 's' : ''} to report
                  </p>
                )}
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
                          ? 'bg-orange-500 text-white border-orange-600 shadow-md'
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
                  Incident Location *
                </label>
                <div className="relative">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] outline-none transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>
                      Select Location...
                    </option>
                    <option value="WORK">Work</option>
                    <option value="HOME">Home</option>
                    <option value="OTHER">Other</option>
                  </select>
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
                {evidenceUrl && evidenceUrl.startsWith('data:image/') && (
                  <div className="mt-3 relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner group">
                    <img
                      src={evidenceUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceUrl('');
                          setSelectedFile(null);
                        }}
                        className="px-3 py-1.5 bg-orange-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg"
                      >
                        Remove Attachment
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isReadingFile}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transform active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting || isReadingFile ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      Submit{' '}
                      {selectedAssetIds.length > 1
                        ? `(${selectedAssetIds.length}) `
                        : ''}
                      Report
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
