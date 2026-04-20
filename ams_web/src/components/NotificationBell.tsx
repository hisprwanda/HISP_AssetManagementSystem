import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  XCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: 'CEO_APPROVED' | 'CEO_REJECTED' | 'INFO' | 'ALERT' | 'INCIDENT';
  request_id?: string;
  request_title?: string;
  created_at: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await api.get(`/notifications?userId=${user.id}`);
      return res.data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async (notifId: string) => {
      await api.patch(`/notifications/${notifId}/read?userId=${user?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/notifications/read-all?userId=${user?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CEO_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'CEO_REJECTED':
      case 'ALERT':
        return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'INCIDENT':
        return <Bell className="w-4 h-4 text-orange-500 shrink-0" />;
      default:
        return <ShoppingCart className="w-4 h-4 text-orange-500 shrink-0" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff8000] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#ff8000] hover:bg-orange-50 rounded-lg transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-5 py-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${
                    !notif.is_read ? 'bg-orange-50/40' : ''
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markReadMutation.mutate(notif.id);
                  }}
                >
                  <div className="pt-0.5">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p
                        className={`text-xs font-black text-slate-900 leading-tight ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}
                      >
                        {notif.title.replace('✅ ', '')}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    {!notif.is_read && (
                      <span className="inline-block mt-1.5 w-1.5 h-1.5 bg-[#ff8000] rounded-full" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
