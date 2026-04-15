import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  ClipboardCheck,
  AlertTriangle,
  Download,
  ArrowRight,
  ShieldCheck,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../types/assets';

export const AuditTrail = () => {
  const navigate = useNavigate();

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
      title: 'Disposal Register',
      description:
        'Detailed logs of retired assets, recovery values, and disposal reasons.',
      icon: Archive,
      link: '/disposal-logs',
      type: 'disposal',
      primary: true,
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
      link: '/incidents',
      type: 'incident',
    },
    {
      title: 'System Activity Logs',
      description:
        'Audit trail of administrative actions, edits, and system changes.',
      icon: Activity,
      link: '#',
      type: 'audit',
    },
  ];

  const handleDownload = (type: string) => {
    console.log(`Downloading ${type} logs...`);
  };

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Audit Trail Hub
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Centralized oversight of all system activities and logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500"
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {stat.value}
              </h3>
            </div>
            <div
              className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
            >
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {logCategories.map((cat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl ${cat.primary ? 'bg-orange-50' : 'bg-slate-50'} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <cat.icon
                    className={`w-8 h-8 ${cat.primary ? 'text-[#ff8000]' : 'text-slate-400'}`}
                  />
                </div>
                <button
                  onClick={() => handleDownload(cat.type)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff8000] transition-colors shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-[#ff8000] transition-colors">
                {cat.title}
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 flex-1">
                {cat.description}
              </p>

              <button
                onClick={() => navigate(cat.link)}
                className="flex items-center gap-2 text-xs font-black text-[#ff8000] uppercase tracking-widest group-hover:translate-x-2 transition-transform"
              >
                View Detailed Logs <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" /> Recent System
            Events
          </h3>
          <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#ff8000] transition-colors">
            View All History &rarr;
          </button>
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-orange-400 transition-colors" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">
                  {i === 0
                    ? 'Admin updated furniture category disposal rules'
                    : i === 1
                      ? 'New asset incident report filed for HISP-RW-102'
                      : 'Quarterly assignment report generated'}
                </p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                  {i === 0
                    ? '2 hours ago'
                    : i === 1
                      ? '5 hours ago'
                      : 'Yesterday'}{' '}
                  • System Log
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
