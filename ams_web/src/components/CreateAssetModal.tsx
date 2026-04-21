import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  Hash,
  Tag as TagIcon,
  Building2,
  User as UserIcon,
  Calendar,
  Banknote,
  MapPin,
  Box,
} from 'lucide-react';
import { api } from '../lib/api';
import { Category } from '@/types/assets';

interface User {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategoryId?: string;
}

export const CreateAssetModal = ({
  isOpen,
  onClose,
  preselectedCategoryId,
}: CreateAssetModalProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    tag_id: '',
    description: '',
    status: 'IN_STOCK',
    category_id: preselectedCategoryId || '',
    department_id: '',
    assigned_to_user_id: '',
    location: '',
    purchase_cost: '',
    purchase_date: '',
    warranty_expiry: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
    enabled: isOpen,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    enabled: isOpen,
  });

  const { data: users, isFetching: loadingUsers } = useQuery({
    queryKey: ['users', formData.department_id],
    queryFn: async () => {
      if (!formData.department_id) return [];
      const response = await api.get('/users', {
        params: { departmentId: formData.department_id },
      });
      return response.data;
    },
    enabled: isOpen && !!formData.department_id,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        purchase_cost: formData.purchase_cost
          ? parseFloat(formData.purchase_cost)
          : undefined,
        serial_number: formData.serial_number.trim() || null,
        tag_id: formData.tag_id.trim() || undefined,
        purchase_date: formData.purchase_date || undefined,
        warranty_expiry: formData.warranty_expiry || undefined,
        department_id: formData.department_id || null,
        assigned_to_user_id: formData.assigned_to_user_id || null,
      };

      await api.post('/assets', payload);

      queryClient.invalidateQueries({ queryKey: ['assets'] });

      onClose();
      setFormData({
        name: '',
        serial_number: '',
        tag_id: '',
        description: '',
        status: 'IN_STOCK',
        category_id: preselectedCategoryId || '',
        department_id: '',
        assigned_to_user_id: '',
        location: '',
        purchase_cost: '',
        purchase_date: '',
        warranty_expiry: '',
      });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message ||
          'Failed to assign asset. Please check serial number uniqueness.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Assign New Asset
            </h2>
            <p className="text-xs font-bold text-[#ff8000] uppercase tracking-wider mt-1">
              Inventory Management
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-8"
        >
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center">
              {error}
            </div>
          )}
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#e49f37]" /> Hardware
              Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Asset Name / Model *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., MacBook Pro 16 M2"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Category *
                </label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium appearance-none"
                  >
                    <option value="" disabled>
                      Select Category...
                    </option>
                    {categories?.map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ff8000]">
                  Initial Status
                </label>
                <div className="relative">
                  <div className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-black flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    IN STOCK (PENDING VERIFICATION)
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-bold italic">
                    All new assets start in stock for digital verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#e49f37]" /> Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="SN-XXXX-YYYY"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Internal Tag ID *
                </label>
                <div className="relative">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="HISP-RWA-001"
                    value={formData.tag_id}
                    onChange={(e) =>
                      setFormData({ ...formData, tag_id: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#e49f37]" /> Deployment
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Owning Directorate *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    required={!!formData.assigned_to_user_id}
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department_id: e.target.value,
                        assigned_to_user_id: '',
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium appearance-none"
                  >
                    <option value="">Select Directorate...</option>
                    {departments?.map((d: { id: string; name: string }) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Assigned To (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <select
                    value={formData.assigned_to_user_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        assigned_to_user_id: e.target.value,
                        status: e.target.value ? 'ASSIGNED' : 'IN_STOCK',
                      });
                    }}
                    disabled={!formData.department_id || loadingUsers}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium appearance-none disabled:opacity-40 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.department_id
                        ? 'Select a Directorate first...'
                        : loadingUsers
                          ? 'Loading staff...'
                          : '-- Unassigned --'}
                    </option>
                    {users?.map((u: User) => {
                      const roleName = u.role
                        ? u.role.replace('_', ' ')
                        : 'STAFF';
                      const displayName =
                        u.full_name ||
                        `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                        'Unknown Staff';
                      return (
                        <option key={u.id} value={u.id}>
                          {displayName} — {roleName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-2 group col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Physical Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g., HQ Server Room, Kigali Branch"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#e49f37]" /> Acquisition &
              Warranty
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Cost (RWF)
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={formData.purchase_cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_cost: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Purchase Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_date: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Warranty Expiry
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warranty_expiry: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Initial Book Value (RWF)
                </p>
                <p className="text-sm font-black text-[#e49f37]">
                  {Number(formData.purchase_cost || 0).toLocaleString()} RWF
                </p>
              </div>
              <p className="text-[10px] text-orange-500 font-bold italic uppercase tracking-wider">
                Automated Baseline
              </p>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] py-3 bg-[#ff8000] hover:bg-[#e49f37] text-white font-bold rounded-xl shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transform active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Save & Initiate Receipt <Laptop className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
