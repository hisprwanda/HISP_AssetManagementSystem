import React, { useState } from 'react';
import {
  FileCheck,
  Signature,
  Calendar,
  User as UserIcon,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AssetAssignment } from '../types/assets';
import { api } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AssetReceiptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssetAssignment | null;
}

export const AssetReceiptFormModal = ({
  isOpen,
  onClose,
  assignment,
}: AssetReceiptFormModalProps) => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [signatureName, setSignatureName] = useState('');
  const [adminSignatureName, setAdminSignatureName] = useState('');
  const [error, setError] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isPreparing, setIsPreparing] = useState(
    assignment?.form_status === 'DRAFT' ||
      assignment?.form_status === 'REJECTED' ||
      assignment?.id.includes('legacy-'),
  );
  const [condition, setCondition] = useState(
    assignment?.condition_on_assign || '',
  );
  const [handoverName, setHandoverName] = useState(
    assignment?.received_from_name || 'HISP Administration',
  );
  const [serial, setSerial] = useState(assignment?.asset?.serial_number || '');
  const [tagId, setTagId] = useState(assignment?.asset?.tag_id || '');
  const [phoneNumber, setPhoneNumber] = useState(
    assignment?.user?.phone_number || '',
  );

  React.useEffect(() => {
    if (assignment) {
      setCondition(assignment.condition_on_assign || '');
      setHandoverName(assignment.received_from_name || 'HISP Administration');
      setSerial(assignment.asset?.serial_number || '');
      setTagId(assignment.asset?.tag_id || '');
      setPhoneNumber(assignment.user?.phone_number || '');
      setIsPreparing(
        assignment.form_status === 'DRAFT' ||
          assignment.form_status === 'REJECTED' ||
          assignment.id.includes('legacy-'),
      );
    }
  }, [assignment]);

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) return;
      return await api.patch(`/asset-assignments/${assignment.id}/sign-user`, {
        signatureName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 2000);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message || 'Failed to sign document.'),
  });

  const prepareMutation = useMutation({
    mutationFn: async (sendToUser: boolean) => {
      if (!assignment) return;
      return await api.patch(
        `/asset-assignments/${assignment.id}/prepare-admin`,
        {
          condition_on_assign: condition,
          received_from_name: handoverName,
          asset_serial_number: serial,
          asset_tag_id: tagId,
          user_phone_number: phoneNumber,
          sendToUser,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      onClose();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (approve: boolean) => {
      if (!assignment) return;
      return await api.patch(`/asset-assignments/${assignment.id}/verify`, {
        approve,
        remarks: !approve ? rejectionRemarks : undefined,
        adminSignatureName: approve ? adminSignatureName : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 2000);
    },
  });

  if (!isOpen || !assignment) return null;

  const steps = [
    {
      label: 'Admin Prep',
      active: assignment.form_status === 'DRAFT',
      completed: assignment.form_status !== 'DRAFT',
    },
    {
      label: 'Staff Signature',
      active:
        assignment.form_status === 'PENDING_USER_SIGNATURE' ||
        assignment.form_status === 'REJECTED',
      completed: ['PENDING_ADMIN_REVIEW', 'APPROVED'].includes(
        assignment.form_status,
      ),
    },
    {
      label: 'Admin Review',
      active: assignment.form_status === 'PENDING_ADMIN_REVIEW',
      completed: assignment.form_status === 'APPROVED',
    },
    {
      label: 'Handover Done',
      active: assignment.form_status === 'APPROVED',
      completed: assignment.form_status === 'APPROVED',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const canEdit = isAdmin && isPreparing;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-[3rem] p-12 shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-[#ff8000]" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
            Form Signed!
          </h2>
          <p className="text-slate-500 font-medium">
            Your digital signature has been recorded. The form has been
            submitted for final admin verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-y-4 right-4 w-full md:w-[750px] bg-white rounded-[2rem] shadow-2xl z-[70] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500 border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-inner">
              <FileCheck className="w-6 h-6 text-[#ff8000]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">
                Asset Receipt Form
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  {assignment.form_number || 'STAGED-FORM'}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                    assignment.form_status === 'APPROVED'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : assignment.form_status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : assignment.form_status === 'PENDING_ADMIN_REVIEW'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}
                >
                  {assignment.form_status?.replace(/_/g, ' ') || 'STAGED'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fafbfd] print:bg-white print:p-0">
          <div className="flex justify-between items-center max-w-lg mx-auto print:hidden bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 relative"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    step.completed
                      ? 'bg-[#ff8000] border-[#ff8000] text-white shadow-[0_0_15px_rgba(255,128,0,0.3)]'
                      : step.active
                        ? 'bg-white border-[#ff8000] text-[#ff8000] animate-pulse'
                        : 'bg-white border-slate-200 text-slate-300'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-black">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    step.active || step.completed
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-[calc(100%+0.5rem)] top-5 w-8 h-[2px] ${
                      step.completed ? 'bg-[#ff8000]' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:rounded-none print-content">
            {assignment.form_status !== 'APPROVED' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-35deg] select-none print:hidden">
                <span className="text-[120px] font-black tracking-tighter uppercase">
                  VOID FORM
                </span>
              </div>
            )}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div className="flex items-center gap-4">
                <img
                  src="/hisp.png"
                  alt="HISP Logo"
                  className="w-16 h-16 object-contain"
                />
                <div className="space-y-0.5">
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter">
                    HISP RWANDA
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Health Information Systems Program
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  Asset Receipt Form
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic">
                  Official Handover Documentation
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#ff8000] border-b border-orange-100 pb-2">
                  Part A: Handed Over By
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <UserIcon className="w-5 h-5 text-slate-300" />
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Full Names
                      </span>
                      {canEdit ? (
                        <input
                          type="text"
                          value={handoverName}
                          onChange={(e) => setHandoverName(e.target.value)}
                          className="text-sm font-bold text-slate-800 border-b border-slate-200 outline-none focus:border-orange-500 bg-orange-50/30 px-1"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-800">
                          {assignment.received_from_name ||
                            'HISP Administration'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Handover Date
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {new Date(
                          assignment.received_at || assignment.assigned_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Mail className="w-5 h-5 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Contact Email
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        admin@hispoc.org
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#ff8000] border-b border-orange-100 pb-2">
                  Part B: Received By (Custody)
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <UserIcon className="w-5 h-5 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Staff Names
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {assignment.user?.full_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Mail className="w-5 h-5 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Email Address
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {assignment.user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-5 h-5 text-slate-300" />
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Telephone / Extension
                      </span>
                      {canEdit ? (
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. +250 788..."
                          className="text-sm font-bold text-slate-800 border-b border-slate-200 outline-none focus:border-orange-500 bg-orange-50/30 px-1"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-800">
                          {assignment.user?.phone_number || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#ff8000] border-b border-orange-100 pb-2">
                Part C: Asset Specifications
              </h4>
              <div className="border-2 border-slate-900 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/20">
                        Item #
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/20">
                        Component / Asset Type
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/20">
                        Serial Number
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest">
                        Inventory Tag ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-800">
                      <td className="px-3 py-2 text-sm font-bold border-r border-slate-900 text-center">
                        01
                      </td>
                      <td className="px-3 py-2 text-sm font-bold border-r border-slate-900">
                        {assignment.asset?.name}
                      </td>
                      <td className="px-3 py-2 text-sm font-bold border-r border-slate-900 font-mono tracking-wider">
                        {canEdit ? (
                          <input
                            type="text"
                            value={serial}
                            onChange={(e) => setSerial(e.target.value)}
                            className="bg-orange-50/50 w-full outline-none focus:ring-1 focus:ring-orange-500 rounded px-1"
                          />
                        ) : (
                          assignment.asset?.serial_number
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-bold font-mono tracking-wider bg-slate-50">
                        {canEdit ? (
                          <input
                            type="text"
                            value={tagId}
                            onChange={(e) => setTagId(e.target.value)}
                            className="bg-orange-100/50 w-full outline-none focus:ring-1 focus:ring-orange-500 rounded px-1"
                          />
                        ) : (
                          assignment.asset?.tag_id
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Condition on Handover
                </p>
                {canEdit ? (
                  <textarea
                    value={condition || ''}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="Enter current asset condition..."
                    className="w-full text-xs font-medium text-slate-700 italic bg-orange-50/50 border-2 border-orange-100 rounded-xl p-3 outline-none focus:border-orange-500 focus:bg-white transition-all min-h-[60px] resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-600 italic">
                    "
                    {assignment.condition_on_assign ||
                      'Asset is in excellent working condition as verified by administration.'}
                    "
                  </p>
                )}
              </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-[1rem] text-white space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle2 className="w-24 h-24" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400 underline decoration-2 underline-offset-4">
                Declaration of Responsibility
              </h4>
              <p className="text-xs font-medium leading-[1.8] text-slate-300 text-justify">
                I,{' '}
                <span className="text-white font-bold underline decoration-orange-400 underline-offset-4">
                  {assignment.user?.full_name}
                </span>
                , hereby acknowledge receipt of the asset(s) listed above in the
                condition described. I understand that I am fully responsible
                for its safe custody, proper usage, and maintenance as per HISP
                Rwanda policies. I agree to immediately report any loss, theft,
                or damage to the administration and acknowledge that financial
                penalties may apply if damage results from negligence. This
                asset remains the property of HISP Rwanda and must be returned
                upon request or end of service.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="space-y-3">
                <div className="h-20 flex items-end justify-center border-b-2 border-slate-900 relative">
                  {assignment.user_signature_name ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in">
                      <span className="text-2xl font-['Dancing_Script',_cursive] text-slate-800 transform -rotate-1 px-4">
                        {assignment.user_signature_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                      Awaiting Recipient Signature
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Signer: {assignment.user?.full_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {assignment.user_signed_at
                      ? `Signed on ${new Date(assignment.user_signed_at).toLocaleString()}`
                      : 'Recipient (Staff / User)'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-24 flex items-end justify-center border-b-2 border-slate-900 relative">
                  {assignment.admin_signature_name ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in">
                      <span className="text-2xl font-['Dancing_Script',_cursive] text-slate-800 transform rotate-1 px-4">
                        {assignment.admin_signature_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                      Awaiting Admin Verification
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Administrator: HISP RWANDA
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {assignment.admin_signed_at
                      ? `Verified on ${new Date(assignment.admin_signed_at).toLocaleString()}`
                      : 'Authorized Administration'}
                  </p>
                </div>
              </div>
            </div>
            {assignment.form_status === 'REJECTED' && (
              <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-rose-700 uppercase tracking-widest">
                    Rejection Notice
                  </h4>
                  <p className="text-xs font-medium text-rose-600 leading-relaxed italic">
                    "
                    {assignment.rejection_reason ||
                      'Information provided does not match our records.'}
                    "
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isAdmin &&
          (assignment.form_status === 'PENDING_USER_SIGNATURE' ||
            assignment.form_status === 'REJECTED') && (
            <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-20">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Signature className="w-4 h-4 text-orange-500" /> Confirm Full
                  Name for Digital Signature
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => {
                    setSignatureName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your full name"
                  className={`w-full px-6 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/10'} rounded-2xl outline-none focus:ring-4 text-lg font-['Dancing_Script',_cursive] transition-all placeholder:font-sans placeholder:text-sm`}
                />
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest leading-none">
                      {error}
                    </p>
                  </div>
                )}
                <p className="text-[10px] font-bold text-slate-400 italic">
                  By typing your full names above, you are creating a legally
                  binding digital signature to the declaration above.
                </p>
              </div>
              <button
                onClick={() => signMutation.mutate()}
                disabled={!signatureName || signMutation.isPending}
                className="w-full py-5 bg-[#ff8000] hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-[0_15px_30px_-10px_rgba(255,128,0,0.4)] transform active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {signMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing Document...
                  </>
                ) : (
                  <>
                    Sign & Submit Form <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

        {isAdmin && canEdit && (
          <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-20">
            <div className="flex gap-4">
              <button
                onClick={() => prepareMutation.mutate(false)}
                disabled={prepareMutation.isPending}
                className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
              >
                Save Draft
              </button>
              <button
                onClick={() => prepareMutation.mutate(true)}
                disabled={prepareMutation.isPending}
                className="flex-[2] py-5 bg-[#ff8000] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-[0_15px_30px_-10px_rgba(255,128,0,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {prepareMutation.isPending ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Ready & Send to Recipient{' '}
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center italic">
              "Ready & Send" will move the form to the Staff member's portal for
              their digital signature.
            </p>
          </div>
        )}

        {isAdmin && assignment.form_status === 'PENDING_ADMIN_REVIEW' && (
          <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-20">
            {showRejectionForm ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Reason for Rejection
                  </h3>
                  <button
                    onClick={() => setShowRejectionForm(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={rejectionRemarks}
                  onChange={(e) => setRejectionRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 min-h-[100px]"
                  placeholder="e.g., Serial number listed is incorrect or staff details need update..."
                />
                <button
                  onClick={() => verifyMutation.mutate(false)}
                  disabled={!rejectionRemarks || verifyMutation.isPending}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Signature className="w-4 h-4 text-orange-500" /> Admin
                    Approval Signature
                  </label>
                  <input
                    type="text"
                    value={adminSignatureName}
                    onChange={(e) => {
                      setAdminSignatureName(e.target.value);
                      setError('');
                    }}
                    placeholder='Type "HISP Administration" or your name'
                    className={`w-full px-6 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'} rounded-2xl outline-none focus:ring-4 text-lg font-['Dancing_Script',_cursive] transition-all placeholder:font-sans placeholder:text-sm`}
                  />
                  {error && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                      {error}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowRejectionForm(true)}
                    className="py-5 bg-white border-2 border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    Reject Form <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => verifyMutation.mutate(true)}
                    disabled={verifyMutation.isPending || !adminSignatureName}
                    className="py-5 bg-[#ff8000] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-[0_15px_30px_-10px_rgba(255,128,0,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {verifyMutation.isPending ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Verify & Approve <CheckCircle2 className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {(assignment.form_status === 'APPROVED' ||
          !isAdmin ||
          (isAdmin &&
            (assignment.form_status === 'PENDING_USER_SIGNATURE' ||
              assignment.form_status === 'PENDING_ADMIN_REVIEW'))) && (
          <div className="p-8 border-t border-slate-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)] flex gap-4 print:hidden">
            {isAdmin && (
              <button
                onClick={handlePrint}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5 text-slate-400" /> Print Document
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl"
            >
              Close
            </button>
          </div>
        )}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .print:hidden { display: none !important; }
        }
      `,
        }}
      />
    </>
  );
};
