import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  ShoppingCart,
  FileClock,
  Laptop,
  Banknote,
  Terminal,
  Activity,
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
      color: 'text-[#ff8000]',
      bg: 'bg-orange-50',
    },
    {
      label: 'Retired Assets',
      value: assets?.filter((a: Asset) => a.status === 'DISPOSED').length || 0,
      icon: Archive,
      color: 'text-[#ff8000]',
      bg: 'bg-orange-50',
    },
    {
      label: 'Reported Incidents',
      value: incidents?.length || 0,
      icon: AlertTriangle,
      color: 'text-[#ff8000]',
      bg: 'bg-orange-50',
    },
  ];

  const auditSections = [
    {
      id: 'inventory',
      name: 'Inventory & Operations',
      description: 'Core tracking of hardware lifecycle and staff assignments.',
      items: [
        {
          title: 'Asset Registry',
          description:
            'Historical logs of all system hardware assets with comprehensive lifecycle tracking.',
          icon: Laptop,
          link: '/asset-trail',
          accent: 'blue',
        },
        {
          title: 'Assignment History',
          description:
            'Full custody record of asset movements and signed digital handover receipts.',
          icon: ClipboardCheck,
          link: '/assignment-history',
          accent: 'indigo',
        },
        {
          title: 'Maintenance & Incidents',
          description:
            'Consolidated record of physical damages, repairs, and administrative resolutions.',
          icon: ShieldCheck,
          link: '/incident-trail',
          accent: 'rose',
        },
      ],
    },
    {
      id: 'financial',
      name: 'Financial & Procurement',
      description: 'Audit trails for procurement cycles and valuation records.',
      items: [
        {
          title: 'Financial Records',
          description:
            'Comprehensive record of purchase costs, depreciation, and current market valuations.',
          icon: Banknote,
          link: '/financial-trail',
          accent: 'emerald',
        },
        {
          title: 'Procurement Archive',
          description:
            'Official Purchase Orders, vendor acceptance logs, and fulfillment records.',
          icon: ShoppingCart,
          link: '/procurement-trail',
          accent: 'amber',
        },
        {
          title: 'Request Logs',
          description:
            'Detailed history of all procurement requisitions and approval timelines.',
          icon: FileClock,
          link: '/request-trail',
          accent: 'orange',
        },
      ],
    },
    {
      id: 'administrative',
      name: 'Governance & Archival',
      description: 'Administrative logs for disposal and system-level actions.',
      items: [
        {
          title: 'Disposal Registry',
          description:
            'Final logs of retired assets, recovery values, and official disposal reasons.',
          icon: Archive,
          link: '/disposal-logs',
          accent: 'slate',
        },
        {
          title: 'System Activity',
          description:
            'Backend logs of critical system changes and administrator interventions.',
          icon: Terminal,
          link: '/system-trail',
          accent: 'violet',
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex items-center gap-4 hover:bg-white transition-all duration-500"
          >
            <div
              className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shadow-inner transition-transform duration-500`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {stat.value}
                </h3>
                <span className="text-[9px] font-semibold text-slate-300 uppercase">
                  Units
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-12">
        {auditSections.map((section) => (
          <div key={section.id} className="space-y-6">
            <div className="sticky top-0 z-20 bg-[#f8fafc] border-b border-slate-100 mb-6 py-2">
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#ff8000] rounded-full" />
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                      {section.name}
                    </h2>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 tracking-wide">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(cat.link)}
                  className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] p-5 shadow-sm hover:border-[#ff8000]/20 transition-all duration-500 group cursor-pointer flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50/50 rounded-full transition-transform duration-700" />

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-[#ff8000] transition-all duration-500 shadow-inner">
                      <cat.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors duration-500" />
                    </div>
                  </div>

                  <div className="relative z-10 flex-1">
                    <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-[#ff8000] transition-colors tracking-tight">
                      {cat.title}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-semibold leading-relaxed mb-4 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold text-[#ff8000] uppercase tracking-widest flex items-center gap-2">
                      Access Audit Log <Activity className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
