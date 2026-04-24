import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Building2,
  ArrowLeft,
  Mail,
  Shield,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Search,
  Eye,
  Phone,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { CreateDepartmentModal } from '../components/CreateDepartmentModal';
import { EditDepartmentModal } from '../components/EditDepartmentModal';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ViewUserModal } from '../components/ViewUserModal';
import { ViewDepartmentModal } from '../components/ViewDepartmentModal';
import { Pagination } from '../components/Pagination';

interface Department {
  id: string;
  name: string;
  type: string;
  status: string;
  users?: User[];
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  departmentId: string;
}

export const Directorate = () => {
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Organisational Units');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { isAdmin, isCEO } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [deptToView, setDeptToView] = useState<Department | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: departments, isLoading: loadingDepts } = useQuery<Department[]>(
    {
      queryKey: ['departments'],
      queryFn: async () => {
        const response = await api.get('/departments');
        return response.data;
      },
    },
  );

  const { data: staff, isLoading: loadingStaff } = useQuery<User[]>({
    queryKey: ['users', selectedDept?.id],
    queryFn: async () => {
      const response = await api.get(`/users`, {
        params: { departmentId: selectedDept?.id },
      });
      return response.data;
    },
    enabled: !!selectedDept,
  });

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(staffSearch.toLowerCase()),
    );
  }, [staff, staffSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [staffSearch]);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: async (deptId: string) => {
      await api.delete(`/departments/${deptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeptToDelete(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', selectedDept?.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
  });

  const handleEditClick = (e: React.SyntheticEvent, dept: Department) => {
    e.stopPropagation();
    setDeptToEdit(dept);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: React.SyntheticEvent, dept: Department) => {
    e.stopPropagation();
    setDeptToDelete(dept);
  };

  if (!selectedDept) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1" />
          {isAdmin && (
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 text-sm rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              NEW ORGANIZATIONAL UNIT
            </button>
          )}
        </div>

        {loadingDepts ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-[#ff8000]/30 border-t-[#ff8000] rounded-full animate-spin"></div>
          </div>
        ) : departments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              No Directorates Yet
            </h3>
            <p className="text-slate-400 font-medium text-sm">
              Create your first directorate to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments?.map((dept) => (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept)}
                className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,128,0,0.1)] hover:border-[#ff8000]/30 cursor-pointer transition-all group transform hover:-translate-y-1 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-[#ff8000] transition-colors shadow-sm">
                    <Building2 className="w-5 h-5 text-[#ff8000] group-hover:text-white transition-colors" />
                  </div>

                  <div className="flex gap-1 transition-opacity">
                    {(isAdmin || isCEO) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeptToView(dept);
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Unit Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => handleEditClick(e, dept)}
                          className="p-2 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Organisation Unit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, dept)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Organisation Unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3
                  className="text-lg font-semibold text-slate-800 mb-0.5 truncate"
                  title={dept.name}
                >
                  {dept.name}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mb-4 flex-1 uppercase tracking-wider">
                  {dept.type}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400">
                      Status
                    </span>
                    <span
                      className={`text-sm font-bold flex items-center gap-1 ${
                        dept.status === 'Inactive' ||
                        !dept.users ||
                        dept.users.length === 0
                          ? 'text-slate-400'
                          : 'text-emerald-600'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          dept.status === 'Inactive' ||
                          !dept.users ||
                          dept.users.length === 0
                            ? 'bg-slate-300'
                            : 'bg-emerald-500 animate-pulse'
                        }`}
                      />{' '}
                      {dept.status === 'Inactive' ||
                      !dept.users ||
                      dept.users.length === 0
                        ? 'Inactive'
                        : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                    <span className="text-[10px] font-semibold text-[#ff8000] uppercase tracking-widest">
                      {dept.users?.length || 0} Personnel &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateDepartmentModal
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
        />

        <EditDepartmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setDeptToEdit(null);
          }}
          department={deptToEdit}
        />

        <ViewDepartmentModal
          isOpen={!!deptToView}
          onClose={() => setDeptToView(null)}
          department={deptToView}
        />

        {deptToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeptToDelete(null)}
            />
            <div className="relative z-10 bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 mx-auto">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 text-center mb-2">
                Delete Organisation Unit?
              </h2>
              <p className="text-slate-500 text-sm font-medium text-center mb-6">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-700">
                  "{deptToDelete.name}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeptToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deptToDelete.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <button
          onClick={() => setSelectedDept(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#ff8000] transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Organisation Units
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Building2 className="w-5 h-5 text-[#e49f37]" />
              <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                {selectedDept.name}
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              Managing staff and access for this unit.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 rounded-xl font-bold shadow-[0_8px_16px_-6px_rgba(255,128,0,0.4)] transform active:scale-95 transition-all flex items-center gap-2 group text-sm"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Provision Staff
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="staff-search"
            type="text"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            placeholder="Search staff by name or email..."
            className="w-full bg-transparent border-none pl-10 pr-8 py-2 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
          {staffSearch && (
            <button
              onClick={() => setStaffSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Personnel
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Phone Number
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Contact
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  System Role
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {loadingStaff && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400 font-bold"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#ff8000]/30 border-t-[#ff8000] rounded-full animate-spin" />
                      Loading staff...
                    </div>
                  </td>
                </tr>
              )}

              {!loadingStaff && filteredStaff.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-slate-400 font-bold"
                  >
                    {staffSearch
                      ? 'No staff match your search.'
                      : 'No staff assigned to this directorate yet.'}
                  </td>
                </tr>
              )}

              {paginatedStaff.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/60 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff8000]/20 to-[#e49f37]/20 border border-[#ff8000]/10 flex items-center justify-center text-[#ff8000] font-bold text-sm">
                        {user.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {user.full_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          ID: {user.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {user.phone_number || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {user.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                        [
                          'Admin and Finance Director',
                          'Finance Officer',
                          'Operations Officer',
                          'SYSTEM_ADMIN',
                        ].includes(user.role)
                          ? 'bg-orange-50 text-[#ff8000] border-orange-100'
                          : user.role === 'HOD'
                            ? 'bg-orange-50 text-[#ff8000] border-orange-100'
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}
                    >
                      <Shield className="w-3 h-3" /> {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 transition-opacity">
                      {(isAdmin || isCEO) && (
                        <button
                          onClick={() => setUserToView(user)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Staff Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setUserToEdit(user);
                              setIsEditUserModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Staff"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from System"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredStaff.length}
        />
      </div>

      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        department={selectedDept}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setUserToEdit(null);
        }}
        user={userToEdit}
        department={selectedDept}
      />

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setUserToDelete(null)}
          />
          <div className="relative z-10 bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 text-center mb-2">
              Remove Staff Member?
            </h2>
            <p className="text-slate-500 text-sm font-medium text-center mb-6">
              Are you sure you want to remove{' '}
              <span className="font-bold text-slate-700">
                "{userToDelete.full_name}"
              </span>{' '}
              from the system? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUserMutation.mutate(userToDelete.id)}
                disabled={deleteUserMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleteUserMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <ViewUserModal
        isOpen={!!userToView}
        onClose={() => setUserToView(null)}
        user={userToView ? { ...userToView, department: selectedDept } : null}
      />
    </div>
  );
};
