import { AlertCircle, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmActionModalProps) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-rose-50',
          iconBg: 'bg-rose-100',
          icon: 'text-rose-600',
          button:
            'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100',
          Icon: XCircle,
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/30',
          iconBg: 'bg-emerald-50',
          icon: 'text-emerald-500',
          button:
            'bg-[#ff8000] hover:bg-[#e49f37] text-white shadow-lg shadow-orange-100',
          Icon: CheckCircle2,
        };
      case 'info':
      case 'warning':
      default:
        return {
          bg: 'bg-orange-50',
          iconBg: 'bg-orange-100',
          icon: 'text-[#ff8000]',
          button:
            'bg-[#ff8000] hover:bg-[#e49f37] text-white shadow-lg shadow-orange-100',
          Icon: variant === 'warning' ? AlertCircle : HelpCircle,
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.Icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[380px] bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="p-8 flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-5 shadow-sm border border-white/50 backdrop-blur-xl`}
          >
            <Icon className={`w-7 h-7 ${styles.icon}`} />
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase mb-2 px-4">
            {title}
          </h3>

          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed max-w-[280px] px-2">
            {message}
          </p>
        </div>

        <div className="px-8 pb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`flex-[1.5] px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all transform active:scale-95 disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
