import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ChevronRight,
  ShoppingCart,
  FileClock,
  Laptop,
} from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Asset } from '../types/assets';

export const AuditTrail = () => {
  const navigate = useNavigate();
  const { setHeaderTitle } = useOutletContext<{
    setHeaderTitle: (title: string) => void;
  }>();

  useEffect(() => {
    setHeaderTitle('Audit Trail Hub');
    return () => setHeaderTitle('');
  }, [setHeaderTitle]);

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const { data: incidents } = useQuery({
    queryKey: ['asset-incidents'],
    queryFn: async () => {
      const response = await api.get('/asset-incidents');
      return response.data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['asset-assignments'],
    queryFn: async () => {
      const response = await api.get('/asset-assignments');
      return response.data;
    },
  });

  const stats = [
    {
      label: 'Asset Handovers',
      value: assignments?.length || 0,
      icon: ClipboardCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Retired Assets',
      value: assets?.filter((a: Asset) => a.status === 'DISPOSED').length || 0,
      icon: Archive,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      label: 'Reported Incidents',
      value: incidents?.length || 0,
      icon: AlertTriangle,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
  ];

  const logCategories = [
    {
      title: 'Disposal Registry',
      description:
        'Detailed logs of retired assets, recovery values, and disposal reasons.',
      icon: Archive,
      link: '/disposal-logs',
      type: 'disposal',
    },
    {
      title: 'Assignment History',
      description:
        'Full record of asset movement and signed handover receipts.',
      icon: ClipboardCheck,
      link: '/assignment-history',
      type: 'assignment',
    },
    {
      title: 'Maintenance & Incidents',
      description:
        'Record of damages, repairs, and administrative resolutions.',
      icon: ShieldCheck,
      link: '/incident-trail',
      type: 'incident',
    },
    {
      title: 'Procurement Archive',
      description:
        'Official Purchase Orders, vendor acceptance logs, and fulfillment records.',
      icon: ShoppingCart,
      link: '/procurement-trail',
      type: 'procurement',
    },
    {
      title: 'Request Logs',
      description:
        'Comprehensive history of all procurement requisitions, approval timelines, and requester details.',
      icon: FileClock,
      link: '/request-trail',
      type: 'requests',
    },
    {
      title: 'Staff Audit & Provisioning',
      description:
        'Full user registry with automated bulk import and CSV directory export.',
      icon: Activity,
      link: '/system-trail',
      type: 'audit',
    },
    {
      title: 'Asset Registry',
      description:
        'Comprehensive logs of all system hardware assets with lifecycle tracking.',
      icon: Laptop,
      link: '/asset-trail',
      type: 'assets',
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center transition-all duration-300`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                {stat.label}
              </p>
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {logCategories.map((cat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors`}
              >
                <cat.icon
                  className={`w-5 h-5 text-slate-400 group-hover:text-[#ff8000]`}
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-800 mb-2 group-hover:text-[#ff8000] transition-colors">
              {cat.title}
            </h3>
            <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-4 flex-1">
              {cat.description}
            </p>

            <button
              onClick={() => navigate(cat.link)}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-[#ff8000] uppercase tracking-widest group-hover:translate-x-1 transition-transform"
            >
              View Detailed Logs <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
