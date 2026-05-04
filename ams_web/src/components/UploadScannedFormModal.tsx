import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetAssignment } from '../types/assets';

interface UploadScannedFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssetAssignment | null;
}

export const UploadScannedFormModal = ({
  isOpen,
  onClose,
  assignment,
}: UploadScannedFormModalProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!assignment) return;
      return await api.post(
        `/asset-assignments/${assignment.id}/upload-scanned`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
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

  if (!isOpen || !assignment) return null;

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
        <div className="bg-white rounded-[2rem] p-12 shadow-2xl max-w-sm w-full text-center border border-slate-200">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
            Upload Complete
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            The scanned paper trail has been archived successfully.
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
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[90] overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
        <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#ff8000] flex items-center justify-center text-white shadow-lg shadow-orange-100 transform rotate-3">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                Upload Scanned Form
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Digital Archiving
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4 relative group hover:border-[#ff8000] hover:bg-orange-50/30 transition-all cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {file ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-[#ff8000]" />
                </div>
                <span className="text-sm font-bold text-slate-700 truncate max-w-[250px]">
                  {file.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-3 group-hover:scale-110 group-hover:bg-white transition-all">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#ff8000]" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  Click or drag PDF form here
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  PDF ONLY • MAX 10MB
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff8000]" />
              Target Assignment
            </p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                {assignment.asset?.name}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Recipient:{' '}
                <span className="text-slate-800">
                  {assignment.user?.full_name}
                </span>
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploadMutation.isPending}
            className="w-full py-3.5 bg-[#ff8000] hover:bg-[#e67300] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                Archive Scanned Form <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};
