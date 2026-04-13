import { X, Tag, Percent, ArrowDownToLine } from 'lucide-react';
import { Category } from '@/types/assets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface ViewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export const ViewCategoryModal = ({
  isOpen,
  onClose,
  category,
}: ViewCategoryModalProps) => {
  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 shadow-inner relative group">
            <Tag className="w-6 h-6 text-[#ff8000]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff8000] rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
            Category Details
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Overview of the classification and its financial rules.
          </DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff8000]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#ff8000]/10 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8000] mb-1">
              Official Classification
            </p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {category.name}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              Ref: {category.id.substring(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:border-[#ff8000]/30 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center mb-3 group-hover:bg-[#ff8000] transition-colors">
                <Percent className="w-4 h-4 text-[#ff8000] group-hover:text-white transition-colors" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Depreciation
              </p>
              <p className="text-sm font-black text-slate-700">
                {category.depreciation_rate ?? 0}%{' '}
                <span className="text-[10px] text-slate-400 font-bold tracking-normal italic ml-0.5">
                  per year
                </span>
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:border-orange-200 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center mb-3 group-hover:bg-[#ff8000] transition-colors text-[#ff8000] group-hover:text-white">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Disposal Rate
              </p>
              <p className="text-sm font-black text-slate-700">
                {category.disposal_rate ?? 0}%{' '}
                <span className="text-[10px] text-slate-400 font-bold tracking-normal italic ml-0.5">
                  per year
                </span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
