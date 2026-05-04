import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
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
  preSelectedUserId?: string;
  onSuccess: () => void;
}

export const BulkAssetReceiptModal: React.FC<BulkAssetReceiptModalProps> = ({
  isOpen,
  onClose,
  selectedAssetIds = [],
  formNumber,
  preSelectedUserId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(preSelectedUserId || '');
  const [receivedFromName, setReceivedFromName] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [adminSignature, setAdminSignature] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (preSelectedUserId) {
      setUserId(preSelectedUserId);
    }
  }, [preSelectedUserId]);

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

  const admins =
    users?.filter(
      (u) =>
        u.role === 'Admin and Finance Director' ||
        u.role === 'System Admin' ||
        u.role?.toLowerCase() === 'finance officer',
    ) || [];

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

      <div
        className={`relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col ${isSuccess ? 'max-w-sm w-full' : 'w-full max-w-3xl max-h-[90vh]'}`}
      >
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
              Success!
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              The bulk operation was completed successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ${isSignatureView ? 'bg-orange-600 shadow-orange-100' : 'bg-[#ff8000] shadow-orange-100'}`}
                >
                  {isSignatureView ? (
                    <PenTool className="w-5 h-5 text-white" />
                  ) : (
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
                    {isSignatureView
                      ? 'Executive Handover'
                      : isVerificationView
                        ? 'Final Verification'
                        : 'Handover Preparation'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {formNumber
                      ? `Receipt ${formNumber}`
                      : `Hardware Batch • ${selectedAssetIds.length} Items`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7 overflow-y-auto space-y-8 custom-scrollbar">
              {!formNumber && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">
                      Receiving Staff
                    </label>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all cursor-pointer"
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">
                      Handed Over By
                    </label>
                    <select
                      value={receivedFromName}
                      onChange={(e) => setReceivedFromName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select administrator...</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.full_name}>
                          {admin.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">
                      Global Condition Notes
                    </label>
                    <textarea
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      placeholder="Specify the condition of items being handed over..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all min-h-[70px] resize-none"
                    />
                  </div>
                </div>
              )}

              {formNumber && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Recipient
                      </p>
                      <p className="text-xs font-bold text-slate-700">
                        {bulkAssignments?.[0]?.user?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Handed Over By
                      </p>
                      <p className="text-xs font-bold text-slate-700">
                        {bulkAssignments?.[0]?.received_from_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  Hardware Matching Table
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Asset Name
                        </th>
                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Tag ID
                        </th>
                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Serial Number
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="bg-white hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-700">
                            {asset.name}
                          </td>
                          <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {asset.tag_id}
                          </td>
                          <td className="px-4 py-2.5 text-[10px] font-bold text-slate-400">
                            {asset.serial_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isSignatureView && (
                <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
                  <label className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mb-3 block flex items-center gap-2">
                    <PenTool className="w-3 h-3" /> Personnel Signature (Full
                    Name)
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Signature..."
                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-base font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              )}

              {isVerificationView && (
                <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100">
                  <label className="text-[10px] font-bold text-[#ff8000] uppercase tracking-widest mb-3 block flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Admin Verification
                    Signature
                  </label>
                  <input
                    type="text"
                    value={adminSignature}
                    onChange={(e) => setAdminSignature(e.target.value)}
                    placeholder="Admin signature..."
                    className="w-full bg-white border border-orange-200 rounded-2xl px-4 py-4 text-lg font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff8000] outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <div className="p-7 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>

              {!formNumber && (
                <button
                  onClick={() => prepareMutation.mutate()}
                  disabled={
                    prepareMutation.isPending || !userId || !receivedFromName
                  }
                  className="flex-[2] bg-gradient-to-r from-[#ff8000] to-orange-500 hover:shadow-orange-100 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {prepareMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Receipt
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
                    className="flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => verifyMutation.mutate(true)}
                    disabled={verifyMutation.isPending || !adminSignature}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Verify
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
