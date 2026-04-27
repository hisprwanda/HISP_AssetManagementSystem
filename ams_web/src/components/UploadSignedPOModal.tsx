import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetRequest } from '../types/assets';

interface UploadSignedPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssetRequest | null;
}

export const UploadSignedPOModal = ({
  isOpen,
  onClose,
  request,
}: UploadSignedPOModalProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!request) return;
      return await api.post(
        `/assets-requests/${request.id}/upload-po-scanned`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
        setFile(null);
      }, 2000);
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message ||
          'Failed to upload PDF. Please ensure it is a valid PDF file.',
      );
    },
  });

  if (!isOpen || !request) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <div className="bg-white rounded-[2rem] p-12 shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Upload Complete!
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            The physically signed Purchase Order has been archived successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[80]"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[90] overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff8000]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                Upload Signed PO
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Physical PO Digitalization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 relative group hover:border-[#ff8000] hover:bg-orange-50/30 transition-all">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-[#ff8000] mb-2" />
                <span className="text-sm font-bold text-slate-700 truncate max-w-xs">
                  {file.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#ff8000]" />
                </div>
                <p className="text-sm font-bold text-slate-500">
                  Click or drag signed PDF PO here
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  PDF ONLY • MAX 10MB
                </p>
              </div>
            )}
          </div>

          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-2">
            <div className="flex items-center gap-2 text-orange-700">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Requisition Target
              </span>
            </div>
            <p className="text-sm font-bold text-orange-900">{request.title}</p>
            <p className="text-[10px] font-bold text-orange-400">
              PO Number: {request.purchase_order?.po_number || 'N/A'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploadMutation.isPending}
            className="w-full py-5 bg-[#ff8000] hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading Scanned PO...
              </>
            ) : (
              <>
                Archive Scanned PO <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};
