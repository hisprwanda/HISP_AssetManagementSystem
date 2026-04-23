import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  X,
  ClipboardCheck,
  Send,
  CheckCircle2,
  ShieldCheck,
  PenTool,
} from 'lucide-react';
import { api } from '../lib/api';
import { Asset, User, AssetAssignment } from '../types/assets';

interface BulkAssetReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetIds?: string[];
  formNumber?: string;
  onSuccess: () => void;
}

export const BulkAssetReceiptModal: React.FC<BulkAssetReceiptModalProps> = ({
  isOpen,
  onClose,
  selectedAssetIds = [],
  formNumber,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [receivedFromName, setReceivedFromName] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [adminSignature, setAdminSignature] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: isOpen && !formNumber,
  });

  const { data: bulkAssignments } = useQuery<AssetAssignment[]>({
    queryKey: ['bulk-assignments', formNumber],
    queryFn: async () =>
      (await api.get(`/asset-assignments`)).data.filter(
        (a: AssetAssignment) => a.form_number === formNumber,
      ),
    enabled: isOpen && !!formNumber,
  });

  const { data: allAssets } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => (await api.get('/assets')).data,
    enabled: isOpen && selectedAssetIds.length > 0,
  });

  const selectedAssets = formNumber
    ? bulkAssignments?.map((a) => a.asset) || []
    : allAssets?.filter((a) => selectedAssetIds.includes(a.id)) || [];

  const prepareMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/asset-assignments/bulk/prepare', {
        asset_ids: selectedAssetIds,
        user_id: userId,
        received_from_name: receivedFromName,
        condition_notes: conditionNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 2000);
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      return await api.patch(
        `/asset-assignments/bulk/${formNumber}/sign-user`,
        {
          signatureName,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 2000);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (approve: boolean) => {
      return await api.patch(`/asset-assignments/bulk/${formNumber}/verify`, {
        approve,
        adminSignatureName: adminSignature,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 2000);
    },
  });

  if (!isOpen) return null;

  const currentStatus = bulkAssignments?.[0]?.form_status;
  const isSignatureView =
    formNumber && currentStatus === 'PENDING_USER_SIGNATURE';
  const isVerificationView =
    formNumber && currentStatus === 'PENDING_ADMIN_REVIEW';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {isSuccess ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Success!</h2>
            <p className="text-slate-500 font-medium">
              The bulk operation was completed successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 ${isSignatureView ? 'bg-orange-600' : 'bg-indigo-600'}`}
                >
                  {isSignatureView ? (
                    <PenTool className="w-6 h-6 text-white" />
                  ) : (
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                    {isSignatureView
                      ? 'Sign Handover Receipt'
                      : isVerificationView
                        ? 'Verify Bulk Handover'
                        : 'Bulk Handover Preparation'}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    {formNumber
                      ? `Receipt: ${formNumber}`
                      : `Hardware Cart • ${selectedAssetIds.length} Items`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              {!formNumber && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                      Receiving Staff
                    </label>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select recipient...</option>
                      {users?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.department?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                      Handed Over By
                    </label>
                    <input
                      type="text"
                      value={receivedFromName}
                      onChange={(e) => setReceivedFromName(e.target.value)}
                      placeholder="Admin Name..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                      Global Condition Notes
                    </label>
                    <textarea
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      placeholder="Shared notes for all items in this cart..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              )}

              {formNumber && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Recipient
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {bulkAssignments?.[0]?.user?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Handed Over By
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {bulkAssignments?.[0]?.received_from_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Hardware List
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Asset Name
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Tag ID
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Serial Number
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedAssets.map((asset) => (
                        <tr key={asset.id} className="bg-white">
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">
                            {asset.name}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                            {asset.tag_id}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-400">
                            {asset.serial_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isSignatureView && (
                <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100">
                  <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3 block flex items-center gap-2">
                    <PenTool className="w-3 h-3" /> Digital Signature (Full
                    Name)
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Type your full name to sign..."
                    className="w-full bg-white border border-orange-200 rounded-2xl px-4 py-4 text-lg font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                  />
                  <p className="mt-2 text-[10px] text-orange-400 font-medium italic">
                    By signing, you confirm receipt of the hardware items listed
                    above in good working condition.
                  </p>
                </div>
              )}

              {isVerificationView && (
                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3 block flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Admin Verification
                    Signature
                  </label>
                  <input
                    type="text"
                    value={adminSignature}
                    onChange={(e) => setAdminSignature(e.target.value)}
                    placeholder="Admin signature..."
                    className="w-full bg-white border border-indigo-200 rounded-2xl px-4 py-4 text-lg font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>

              {!formNumber && (
                <button
                  onClick={() => prepareMutation.mutate()}
                  disabled={
                    prepareMutation.isPending || !userId || !receivedFromName
                  }
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {prepareMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Generate & Send Receipt
                    </>
                  )}
                </button>
              )}

              {isSignatureView && (
                <button
                  onClick={() => signMutation.mutate()}
                  disabled={signMutation.isPending || !signatureName}
                  className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {signMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" /> Sign & Submit
                    </>
                  )}
                </button>
              )}

              {isVerificationView && (
                <div className="flex gap-2 w-full flex-[2]">
                  <button
                    onClick={() => verifyMutation.mutate(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => verifyMutation.mutate(true)}
                    disabled={verifyMutation.isPending || !adminSignature}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Verify & Finalize
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
