import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Laptop, Hash, Building2, Save } from 'lucide-react';
import { api } from '../lib/api';
import { Asset, Category } from '../pages/Assets';

interface User {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    tag_id: '',
    description: '',
    status: 'IN_STOCK',
    category_id: '',
    department_id: '',
    assigned_to_user_id: '',
    location: '',
    purchase_cost: '',
    purchase_date: '',
    warranty_expiry: '',
  });
  useEffect(() => {
    if (asset && isOpen) {
      setFormData({
        name: asset.name || '',
        serial_number: asset.serial_number || '',
        tag_id: asset.tag_id || '',
        description: asset.description || '',
        status: asset.status || 'IN_STOCK',
        category_id: asset.category?.id || '',
        department_id: asset.department?.id || '',
        assigned_to_user_id: asset.assigned_to?.id || '',
        location: asset.location || '',
        purchase_cost: asset.purchase_cost?.toString() || '',
        purchase_date: asset.purchase_date
          ? new Date(asset.purchase_date).toISOString().split('T')[0]
          : '',
        warranty_expiry: asset.warranty_expiry
          ? new Date(asset.warranty_expiry).toISOString().split('T')[0]
          : '',
      });
    }
  }, [asset, isOpen]);

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
      return (
        await api.get('/users', {
          params: { departmentId: formData.department_id },
        })
      ).data;
    },
    enabled: isOpen && !!formData.department_id,
  });

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        purchase_cost: formData.purchase_cost
          ? parseFloat(formData.purchase_cost.toString())
          : undefined,
        purchase_date: formData.purchase_date || undefined,
        warranty_expiry: formData.warranty_expiry || undefined,
        assigned_to_user_id: formData.assigned_to_user_id || null,
      };
      await api.patch(`/assets/${asset.id}`, payload);

      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onClose();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(axiosError.response?.data?.message || 'Failed to update asset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Update Asset
            </h2>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mt-1">
              Tag: {asset.tag_id || asset.serial_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
              <Laptop className="w-4 h-4 text-blue-500" /> Hardware
              Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Asset Name / Model *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  {categories?.map((c: Category) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="IN_STOCK">In Stock</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNDER_REPAIR">Under Repair</option>
                  <option value="MISSING">Missing</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" /> Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Serial Number *
                </label>
                <input
                  required
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Internal Tag ID
                </label>
                <input
                  type="text"
                  value={formData.tag_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tag_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" /> Deployment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Directorate *
                </label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_id: e.target.value,
                      assigned_to_user_id: '',
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  {departments?.map((d: { id: string; name: string }) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Assigned To
                </label>
                <select
                  value={formData.assigned_to_user_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assigned_to_user_id: e.target.value,
                    })
                  }
                  disabled={!formData.department_id || loadingUsers}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium disabled:opacity-50"
                >
                  <option value="">
                    {loadingUsers ? 'Loading staff...' : '-- Unassigned --'}
                  </option>
                  {users?.map((u: User) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || `${u.first_name} ${u.last_name}`} —{' '}
                      {u.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 group col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2 group col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500">
                  Purchase Cost (RWF)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.purchase_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_cost: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] transform active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Save Changes <Save className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
