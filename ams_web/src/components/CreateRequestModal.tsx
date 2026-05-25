import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  FileText,
  Banknote,
  Building2,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  MapPin,
  User as UserIcon,
  Phone,
  Calculator,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

import { AssetRequest } from '../types/assets';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestMode?: 'SHARED' | 'INDIVIDUAL';
  baseRequest?: AssetRequest | null;
}

interface RequestLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface User {
  id: string;
  full_name?: string;
  role?: string;
  phone_number?: string;
}

export const CreateRequestModal = ({
  isOpen,
  onClose,
  requestMode,
  baseRequest,
}: CreateRequestModalProps) => {
  const { user, isHOD, isAdmin, isCEO } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [departmentId, setDepartmentId] = useState('');
  const [requestedById, setRequestedById] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSharedLocal, setIsSharedLocal] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>(
    {},
  );

  const [items, setItems] = useState<RequestLineItem[]>([
    {
      id:
        typeof crypto.randomUUID !== 'undefined'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 11),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
    },
  ]);

  const [costBasis, setCostBasis] = useState<'BUDGET' | 'MARKET_RESEARCH'>(
    'BUDGET',
  );
  const [transportFees, setTransportFees] = useState<number>(0);
  const [budgetCode1, setBudgetCode1] = useState('');
  const [budgetCode2, setBudgetCode2] = useState('');

  const [destination, setDestination] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (baseRequest) {
        setDepartmentId(baseRequest.department?.id || '');
        setRequestedById(baseRequest.requested_by?.id || '');
        setUrgency(baseRequest.urgency || 'MEDIUM');
        setDescription(baseRequest.description || '');
        setIsSharedLocal(baseRequest.is_shared || false);
        setDestination(baseRequest.logistics?.destination || '');
        setContactName(baseRequest.logistics?.contact_name || '');
        setContactPhone(baseRequest.logistics?.contact_phone || '');

        if (baseRequest.financials) {
          setTransportFees(baseRequest.financials.transport_fees || 0);
          setCostBasis(
            (baseRequest.financials.cost_basis as
              | 'BUDGET'
              | 'MARKET_RESEARCH') || 'BUDGET',
          );
          setBudgetCode1(baseRequest.financials.budget_code_1 || '');
          setBudgetCode2(baseRequest.financials.budget_code_2 || '');
        }

        if (baseRequest.items && baseRequest.items.length > 0) {
          setItems(
            baseRequest.items.map((i) => ({
              id:
                typeof crypto.randomUUID !== 'undefined'
                  ? crypto.randomUUID()
                  : Math.random().toString(36).substring(2, 11),
              name: i.name,
              description: i.description || '',
              quantity: i.quantity,
              unit_price: i.unit_price || 0,
            })),
          );
        }
      } else if ((isHOD || isAdmin || isCEO) && user?.department?.id) {
        setDepartmentId(user.department.id);
        if (requestMode === 'SHARED' || isAdmin || isCEO) {
          setRequestedById(user.id);
          setIsSharedLocal(requestMode === 'SHARED');
        } else {
          setRequestedById('');
          setIsSharedLocal(false);
        }
      } else if (!isHOD && !isAdmin && !isCEO) {
        setDepartmentId('');
        setRequestedById('');
      }
    }
  }, [isOpen, isHOD, isAdmin, isCEO, user, requestMode, baseRequest]);

  const { data: departments, isFetching: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    enabled: isOpen,
  });

  const { data: users, isFetching: loadingUsers } = useQuery({
    queryKey: ['users', departmentId],
    queryFn: async () => {
      if (!departmentId) return [];
      const response = await api.get('/users', {
        params: { departmentId },
      });
      return response.data;
    },
    enabled: isOpen && !!departmentId,
  });

  const itemsSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  }, [items]);

  const grandTotal = itemsSubtotal + transportFees;

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id:
          typeof crypto.randomUUID !== 'undefined'
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11),
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof RequestLineItem,
    value: string | number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const newInvalidFields: Record<string, boolean> = {};

    if (!departmentId) newInvalidFields.departmentId = true;
    if (!requestedById) newInvalidFields.requestedById = true;
    if (!description.trim()) newInvalidFields.description = true;
    if (!destination.trim()) newInvalidFields.destination = true;

    items.forEach((item) => {
      if (!item.name.trim()) newInvalidFields[`item_${item.id}_name`] = true;
      if (item.quantity <= 0)
        newInvalidFields[`item_${item.id}_quantity`] = true;
      if (item.unit_price <= 0)
        newInvalidFields[`item_${item.id}_unit_price`] = true;
    });

    if (Object.keys(newInvalidFields).length > 0) {
      setInvalidFields(newInvalidFields);
      setError('Please fix the highlighted fields before submitting.');
      setIsLoading(false);
      return;
    }

    const validItems = items;

    try {
      let finalTitle = baseRequest
        ? baseRequest.title
        : `Requisition: ${validItems[0].name}${validItems.length > 1 ? ` +${validItems.length - 1} more` : ''}`;

      if (
        isHOD &&
        baseRequest?.status === 'PENDING' &&
        !baseRequest?.title?.startsWith('Formalized:')
      ) {
        finalTitle = `Formalized: ${finalTitle}`;
      }

      const payload = {
        title: finalTitle,
        requested_by_id: requestedById,
        department_id: departmentId,
        urgency,
        status: baseRequest
          ? baseRequest.status === 'PENDING' && isHOD
            ? 'HOD_APPROVED'
            : baseRequest.status === 'HOD_APPROVED' && isAdmin
              ? 'APPROVED'
              : baseRequest.status
          : isCEO
            ? 'CEO_APPROVED'
            : isAdmin
              ? 'APPROVED'
              : isHOD
                ? 'HOD_APPROVED'
                : 'PENDING',
        items: validItems.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        is_shared: isSharedLocal,
        financials: {
          subtotal: itemsSubtotal,
          transport_fees: transportFees,
          grand_total: grandTotal,
          cost_basis: costBasis,
          budget_code_1: budgetCode1,
          budget_code_2: budgetCode2,
        },
        logistics: {
          destination,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        },
        description,
        ...(baseRequest && isAdmin ? { verified_by_finance_id: user?.id } : {}),
      };

      if (baseRequest) {
        await api.patch(`/assets-requests/${baseRequest.id}`, payload);
      } else {
        await api.post('/assets-requests', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['assets-requests'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setError('');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || 'Failed to submit requisition.',
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

      <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-orange-100 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8 text-[#ff8000]" />
            </div>
            <h2 className="text-3xl font-semibold text-slate-800 tracking-tight mb-4">
              {baseRequest ? 'Requisition Updated!' : 'Requisition Submitted!'}
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
              {baseRequest
                ? 'Your changes have been saved. The requisition remains in the pipeline for executive review.'
                : isAdmin
                  ? 'Your official procurement requisition has been successfully logged and forwarded to the Office of the CEO for final review.'
                  : 'Your official procurement requisition has been successfully logged and forwarded to the Administration & Finance team for final review.'}
            </p>
            <div className="mt-12 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              Updating Pipeline...
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ff8000]" />{' '}
                  {requestMode === 'SHARED'
                    ? 'Official Purchase Requisition (Shared Asset)'
                    : requestMode === 'INDIVIDUAL'
                      ? 'Official Purchase Requisition (Individual Asset)'
                      : 'Official Purchase Requisition'}
                </h2>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-8 space-y-8 bg-white"
            >
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                    Requesting Department *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      required
                      value={departmentId}
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        setRequestedById('');
                        setInvalidFields((prev) => ({
                          ...prev,
                          departmentId: false,
                        }));
                      }}
                      disabled={loadingDepts || isHOD}
                      className={`w-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 transition-all text-sm font-medium appearance-none disabled:opacity-50 rounded-xl border ${invalidFields.departmentId
                        ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                        : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                        }`}
                    >
                      <option value="" disabled>
                        {loadingDepts ? 'Loading...' : 'Select Directorate...'}
                      </option>
                      {departments?.map((d: { id: string; name: string }) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!isHOD || requestMode === 'INDIVIDUAL' ? (
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                      Requester *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        required
                        value={requestedById}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setRequestedById(selectedId);
                          setInvalidFields((prev) => ({
                            ...prev,
                            requestedById: false,
                          }));
                          const selectedUser = users?.find(
                            (u: User) => u.id === selectedId,
                          );
                          if (selectedUser?.phone_number) {
                            setContactPhone(selectedUser.phone_number);
                          }
                          if (selectedUser?.full_name) {
                            setContactName(selectedUser.full_name);
                          }
                        }}
                        disabled={!departmentId || loadingUsers}
                        className={`w-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 transition-all text-sm font-medium appearance-none disabled:opacity-50 rounded-xl border ${invalidFields.requestedById
                          ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                          : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                          }`}
                      >
                        <option value="" disabled>
                          {!departmentId
                            ? 'Select Directorate first...'
                            : loadingUsers
                              ? 'Loading...'
                              : 'Select Requester...'}
                        </option>
                        {users?.map((u: User) => {
                          const displayName = u.full_name || 'Unknown Staff';
                          return (
                            <option key={u.id} value={u.id}>
                              {displayName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                      Requester (Shared)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff8000]" />
                      <div className="w-full pl-9 pr-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-[#ff8000] text-sm font-semibold truncate">
                        {user?.full_name} (HOD)
                      </div>
                    </div>
                  </div>
                )}

                {(isHOD || isAdmin || isCEO) && (
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Asset Usage Mode
                    </label>
                    <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl h-[42px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSharedLocal(false);
                          if (requestMode === 'SHARED') setRequestedById('');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!isSharedLocal ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSharedLocal(true);
                          setRequestedById(user?.id || '');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isSharedLocal ? 'bg-[#ff8000] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Shared
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                    Urgency Level *
                  </label>
                  <div className="relative">
                    <AlertTriangle
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${urgency === 'CRITICAL' ? 'text-red-500' : 'text-slate-400'}`}
                    />
                    <select
                      required
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-bold appearance-none ${urgency === 'CRITICAL' ? 'border-red-200 text-red-700 bg-red-50 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 text-slate-700 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'}`}
                    >
                      <option value="LOW">Low (Standard)</option>
                      <option value="MEDIUM">Medium (Normal Operations)</option>
                      <option value="HIGH">High (Blocking Work)</option>
                      <option value="CRITICAL">Critical (System Down)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000]">
                  Justification / Purpose of Procurement *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    required
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setInvalidFields((prev) => ({
                        ...prev,
                        description: false,
                      }));
                    }}
                    placeholder="Briefly describe why these assets/services are needed..."
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium min-h-[80px] resize-none border ${invalidFields.description
                      ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                      : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                      }`}
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#ff8000]" />{' '}
                    Goods/Services Requested
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#ff8000] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/50 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-4 py-4 w-24 text-center text-slate-500 font-semibold uppercase tracking-widest text-[10px]">
                          Qty
                        </th>
                        <th className="px-4 py-4 w-1/4">Item Name</th>
                        <th className="px-4 py-4 w-36">
                          Description / Details
                        </th>
                        <th className="px-4 py-4 w-36 text-right">
                          Unit Price (RWF)
                        </th>
                        <th className="px-4 py-4 w-36 text-right">
                          Total (RWF)
                        </th>
                        <th className="px-4 py-4 w-16 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="bg-white group">
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => {
                                handleItemChange(
                                  item.id,
                                  'quantity',
                                  parseInt(e.target.value) || 0,
                                );
                                setInvalidFields((prev) => ({
                                  ...prev,
                                  [`item_${item.id}_quantity`]: false,
                                }));
                              }}
                              className={`w-full px-4 py-2 outline-none focus:ring-2 transition-all text-sm font-bold text-center rounded-xl border ${invalidFields[`item_${item.id}_quantity`]
                                ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                                : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                                }`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              placeholder="e.g., HP Screen Monitor"
                              required
                              value={item.name}
                              onChange={(e) => {
                                handleItemChange(
                                  item.id,
                                  'name',
                                  e.target.value,
                                );
                                setInvalidFields((prev) => ({
                                  ...prev,
                                  [`item_${item.id}_name`]: false,
                                }));
                              }}
                              className={`w-full px-4 py-2 outline-none focus:ring-2 transition-all text-sm font-bold rounded-xl border ${invalidFields[`item_${item.id}_name`]
                                ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                                : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                                }`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              placeholder="Additional details..."
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  'description',
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] text-sm font-medium"
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              required
                              value={item.unit_price}
                              onChange={(e) => {
                                handleItemChange(
                                  item.id,
                                  'unit_price',
                                  parseFloat(e.target.value) || 0,
                                );
                                setInvalidFields((prev) => ({
                                  ...prev,
                                  [`item_${item.id}_unit_price`]: false,
                                }));
                              }}
                              className={`w-full px-4 py-2 outline-none focus:ring-2 transition-all text-sm font-bold text-right rounded-xl border ${invalidFields[`item_${item.id}_unit_price`]
                                ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                                : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                                }`}
                            />
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-slate-800">
                            {(item.quantity * item.unit_price).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length === 1}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Subtotal Approved For Goods:
                    </span>
                    <span className="text-lg font-semibold text-slate-800">
                      {itemsSubtotal.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#ff8000]" /> Destination &
                  Logistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 group col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Ship-to Address / Final End Destination *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Kigali HQ, 3rd Floor"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setInvalidFields((prev) => ({
                          ...prev,
                          destination: false,
                        }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium border ${invalidFields.destination
                        ? 'border-red-200 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                        : 'bg-slate-50 border-slate-200 focus:ring-[#ff8000]/20 focus:border-[#ff8000]'
                        }`}
                    />
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Contact Person at Destination
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="+250..."
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#ff8000]" /> Accounting &
                  Final Authorization
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Costs based on (Check A or B) *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="costBasis"
                          value="BUDGET"
                          checked={costBasis === 'BUDGET'}
                          onChange={() => setCostBasis('BUDGET')}
                          className="w-4 h-4 text-[#ff8000] focus:ring-[#ff8000]"
                        />
                        Amount in Budget
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="costBasis"
                          value="MARKET_RESEARCH"
                          checked={costBasis === 'MARKET_RESEARCH'}
                          onChange={() => setCostBasis('MARKET_RESEARCH')}
                          className="w-4 h-4 text-[#ff8000] focus:ring-[#ff8000]"
                        />
                        Market Research
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Est. Transport Fees (RWF)
                    </label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        value={transportFees}
                        onChange={(e) =>
                          setTransportFees(parseFloat(e.target.value) || 0)
                        }
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Budget Code (1)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., BMGF-RCA"
                      value={budgetCode1}
                      onChange={(e) => setBudgetCode1(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] text-sm font-medium uppercase"
                    />
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Budget Code (2)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., HISP-RW"
                      value={budgetCode2}
                      onChange={(e) => setBudgetCode2(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000] text-sm font-medium uppercase"
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex gap-4 mt-auto">
              <div className="flex-1 text-[10px] font-medium text-slate-400 leading-tight">
                By submitting, I certify that the required goods/services are
                necessary to accomplish the objectives of the company and
                sufficient funds are available.
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#ff8000] hover:bg-[#e67300] text-white text-sm font-bold rounded-xl shadow-md transform active:scale-95 transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Requisition <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
