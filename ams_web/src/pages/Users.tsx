import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Search,
  Shield,
  User as UserIcon,
  MoreVertical,
  Building2,
  Mail,
  X,
  Eye,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { ViewUserModal } from '../components/ViewUserModal';

const ROLES = [
  'All',
  'Staff',
  'HOD',
  'Admin and Finance Director',
  'Finance Officer',
  'Operations Officer',
];

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: { name: string; type: string };
}

export const Users = () => {
  const { isAdmin } = useAuth();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('User Management');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [userToView, setUserToView] = useState<User | null>(null);
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex-1" />
        {isAdmin && (
          <button className="bg-[#ff8000] hover:bg-[#e49f37] text-white px-4 py-2 rounded-xl font-bold shadow-md transform active:scale-95 transition-all flex items-center gap-2 group text-sm">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Provision New User
          </button>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white p-1.5 rounded-xl shadow-sm mb-3 flex items-center gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="users-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-transparent border-none pl-10 pr-8 py-2 text-sm focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        <div className="flex gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                roleFilter === role
                  ? 'bg-[#ff8000] text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Personnel
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Contact
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  System Role
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Department
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#ff8000]/30 border-t-[#ff8000] rounded-full animate-spin mb-3"></div>
                      <span className="text-sm font-bold">
                        Synchronizing Directory...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    {searchQuery || roleFilter !== 'All'
                      ? 'No staff members match your search.'
                      : 'No staff members found in the system.'}
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/60 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-xs">
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
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <UserIcon className="w-3 h-3" /> ID:{' '}
                            {user.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          [
                            'Admin and Finance Director',
                            'Finance Officer',
                            'Operations Officer',
                            'SYSTEM_ADMIN',
                          ].includes(user.role)
                            ? 'bg-orange-50 text-[#ff8000] border-orange-100'
                            : user.role === 'HOD'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}
                      >
                        <Shield className="w-3 h-3" /> {user.role}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {user.department?.name || 'Unassigned'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setUserToView(user)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-[#ff8000] hover:bg-white rounded-lg transition-all focus:opacity-100 shadow-sm border border-transparent hover:border-slate-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100/50 bg-white/40 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>
            Showing {filteredUsers.length}
            {users && filteredUsers.length !== users.length
              ? ` of ${users.length}`
              : ''}{' '}
            users
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 hover:bg-white rounded-md transition-colors">
              Prev
            </button>
            <button className="px-3 py-1 hover:bg-white rounded-md transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      <ViewUserModal
        isOpen={!!userToView}
        onClose={() => setUserToView(null)}
        user={userToView}
      />
    </div>
  );
};
