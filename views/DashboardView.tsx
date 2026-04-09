import React, { useMemo, useState } from 'react';
import { Map, Briefcase, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Promoter } from '../types';
import { LeaderDetailsModal } from '../components/Modals';
import { formatDate } from '../utils';

interface DashboardViewProps {
  promoters: Promoter[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ promoters }) => {
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);

  const kpis = {
    vencidos: promoters.filter(p => p.status === 'vencido').length,
    negociacao: promoters.filter(p => p.status === 'negociacao').length,
    confirmados: promoters.filter(p => p.status === 'confirmado').length,
  };

  // --- Logic for Upcoming Vacations (5 Days) ---
  const upcomingVacations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const results: { promoter: Promoter, startDate: string, daysLeft: number }[] = [];

    promoters.forEach(p => {
        const checkPeriod = (startStr: string | null) => {
            if (!startStr) return;
            const start = new Date(startStr + 'T12:00:00');
            start.setHours(0, 0, 0, 0);
            
            // Calculate difference in days
            const diffTime = start.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays <= 5) {
                results.push({
                    promoter: p,
                    startDate: startStr,
                    daysLeft: diffDays
                });
            }
        };

        checkPeriod(p.period1.start);
        checkPeriod(p.period2.start);
    });

    return results.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [promoters]);

  const statsByRegional = useMemo(() => {
    const acc: Record<string, { total: number; }> = {};
    promoters.forEach(p => {
        const reg = p.regional || 'OUTROS';
        if (!acc[reg]) acc[reg] = { total: 0 };
        acc[reg].total++;
    });
    return Object.entries(acc);
  }, [promoters]);

  const statsByLeader = useMemo(() => {
    const acc: Record<string, { total: number; vencido: number; }> = {};
    promoters.forEach(p => {
        const role = p.role || 'SEM LÍDER';
        if (!acc[role]) acc[role] = { total: 0, vencido: 0 };
        acc[role].total++;
        if (p.status === 'vencido') acc[role].vencido++;
    });
    return Object.entries(acc);
  }, [promoters]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <LeaderDetailsModal selectedLeader={selectedLeader} onClose={() => setSelectedLeader(null)} promoters={promoters} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Acompanhe os principais indicadores de férias.</p>
      </div>

      {/* --- New Alert Section --- */}
      {upcomingVacations.length > 0 && (
        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm animate-fadeIn">
            <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-4">
                <Clock className="text-orange-600" size={20} />
                Início Próximo (5 dias)
                <span className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full">{upcomingVacations.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingVacations.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm">
                        <div>
                            <div className="font-bold text-sm text-gray-800">{item.promoter.name}</div>
                            <div className="text-xs text-gray-500">{item.promoter.city}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {item.daysLeft === 0 ? 'Hoje' : `Faltam ${item.daysLeft} dias`}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">{formatDate(item.startDate)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
          <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vencidos</p><p className="text-4xl font-bold text-gray-800 mt-2">{kpis.vencidos}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Em Negociação</p><p className="text-4xl font-bold text-gray-800 mt-2">{kpis.negociacao}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
          <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmados</p><p className="text-4xl font-bold text-gray-800 mt-2">{kpis.confirmados}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-gray-800">
            <div className="bg-blue-100 p-2 rounded-lg"><Map size={20} className="text-blue-600"/></div>
            Regional
          </h3>
          <div className="space-y-4">
            {statsByRegional.map(([reg, d]) => (
              <div key={reg} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
                <span className="text-sm font-medium text-gray-700">{reg}</span>
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{d.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-gray-800">
            <div className="bg-purple-100 p-2 rounded-lg"><Briefcase size={20} className="text-purple-600"/></div>
            Liderança
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {statsByLeader.map(([role, d]) => (
              <div 
                onClick={() => setSelectedLeader(role)} 
                key={role} 
                className="flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
              >
                <span className="text-sm font-medium text-gray-700">{role}</span>
                <div className="flex gap-2">
                  {d.vencido > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">{d.vencido} V</span>}
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{d.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};