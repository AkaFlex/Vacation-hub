import React, { useState, useMemo } from 'react';
import { Download, Filter as FilterIcon, MessageSquare, Trash2, ArrowRightLeft, Megaphone, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Promoter, ColumnFilters } from '../types';
import { formatDate, getReturnDate, addDays } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { ScheduleModal, CommunicationModal, BulkCommunicationModal } from '../components/Modals';
import { supabase } from '../supabase';

type SortField = 'name' | 'balance' | 'status' | 'dueDate' | 'limitDate' | null;
type SortOrder = 'asc' | 'desc';

interface ManagementViewProps {
  promoters: Promoter[];
  setPromoters: React.Dispatch<React.SetStateAction<Promoter[]>>;
  onRefresh: () => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({ promoters, setPromoters, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    promotor: '',
    balance: '',
    status: '',
    dueDate: '',
    limitDate: ''
  });

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [isBulkCommModalOpen, setIsBulkCommModalOpen] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // --- Filtering & Sorting Logic ---
  const filteredPromoters = useMemo(() => {
    let result = promoters.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPromotor = columnFilters.promotor === '' || p.name.toLowerCase().includes(columnFilters.promotor.toLowerCase()) || p.city.toLowerCase().includes(columnFilters.promotor.toLowerCase());
      const matchesBalance = columnFilters.balance === '' || p.balance.toString() === columnFilters.balance;
      const matchesStatus = columnFilters.status === '' || p.status === columnFilters.status;
      const matchesDueDate = columnFilters.dueDate === '' || formatDate(p.dueDate).includes(columnFilters.dueDate);
      const matchesLimit = columnFilters.limitDate === '' || formatDate(p.limitDate).includes(columnFilters.limitDate);
      return matchesSearch && matchesPromotor && matchesBalance && matchesStatus && matchesDueDate && matchesLimit;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aVal: any = a[sortField as keyof Promoter];
        let bVal: any = b[sortField as keyof Promoter];

        if (sortField === 'name') {
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
        } else if (sortField === 'dueDate' || sortField === 'limitDate') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [promoters, searchTerm, columnFilters, sortField, sortOrder]);

  // --- Actions ---
  const toggleNegotiationStatus = async (promoter: Promoter) => {
    const newStatus = promoter.status === 'vencido' ? 'negociacao' : 'vencido';
    
    const { error } = await supabase
      .from('promoters')
      .update({ status: newStatus })
      .eq('id', promoter.id);

    if (error) {
      alert('Erro ao atualizar status: ' + error.message);
    } else {
      onRefresh();
    }
  };

  const handleDeleteVacation = async (id: number) => {
    if(window.confirm("Isso cancelará TODOS os agendamentos deste promotor. Confirmar?")){
        const { error } = await supabase
          .from('promoters')
          .update({ 
            status: 'negociacao', 
            period1: {start: null, duration: 0}, 
            period2: {start: null, duration: 0}, 
            balance: 30 
          })
          .eq('id', id);

        if (error) {
          alert('Erro ao cancelar férias: ' + error.message);
        } else {
          onRefresh();
        }
    }
  };

  const handleOpenSchedule = (promoter: Promoter) => {
    setSelectedPromoter(promoter);
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  const handleOpenComm = (promoter: Promoter) => {
    setSelectedPromoter(promoter);
    setIsCommModalOpen(true);
  };

  // --- Validation Logic (Ported) ---
  const validateAndSaveSchedule = async (startStr: string, duration: number) => {
    if (!selectedPromoter) return;
    if (!startStr) { setScheduleError("Selecione uma data."); return; }
    if (duration <= 0) { setScheduleError("Duração inválida."); return; }
    if (duration > selectedPromoter.balance) { setScheduleError(`Erro: O promotor tem apenas ${selectedPromoter.balance} dias de saldo.`); return; }
    if (selectedPromoter.period1.start && selectedPromoter.period2.start) {
        setScheduleError("⛔ Erro: O promotor já possui o limite de dois períodos de férias agendados.");
        return;
    }

    const endStr = addDays(startStr, duration);
    const start = new Date(startStr + 'T12:00:00');
    const dayOfWeek = start.getDay(); 
    if (dayOfWeek !== 1 && dayOfWeek !== 2) { setScheduleError("⚠️ Início permitido apenas às Segundas ou Terças-feiras."); return; }

    const conflict = promoters.find(p => {
      if (p.id === selectedPromoter.id || p.city !== selectedPromoter.city || p.status !== 'confirmado') return false;
      const checkCollision = (pStart: string | null, pDur: number) => { 
          if(!pStart) return false; 
          const pEnd = addDays(pStart, pDur); 
          return (startStr <= pEnd && endStr >= pStart); 
      };
      return checkCollision(p.period1.start, p.period1.duration) || checkCollision(p.period2.start, p.period2.duration);
    });
    if (conflict) { setScheduleError(`⛔ Conflito: ${conflict.name} já estará de férias em ${selectedPromoter.city} neste período.`); return; }

    const p1 = selectedPromoter.period1;
    const p2 = selectedPromoter.period2;
    let otherPeriod = !p1.start ? p2 : p1;

    if (otherPeriod && otherPeriod.start) {
        const otherStart = new Date(otherPeriod.start + 'T12:00:00');
        const otherEnd = new Date(addDays(otherPeriod.start, otherPeriod.duration) + 'T12:00:00');
        const newStart = new Date(startStr + 'T12:00:00');
        const newEnd = new Date(endStr + 'T12:00:00');

        if (newStart <= otherEnd && newEnd >= otherStart) { setScheduleError(`⛔ Erro: Data coincide com o outro período já marcado.`); return; }
        
        const diffMonths = (newStart.getFullYear() - otherStart.getFullYear()) * 12 + (newStart.getMonth() - otherStart.getMonth());
        if (Math.abs(diffMonths) < 2) { setScheduleError(`⛔ Regra de Intervalo: Férias não podem ser em meses consecutivos.`); return; }
    }

    // Prepare update data
    const updates: Partial<Promoter> = {
        status: 'confirmado',
        balance: selectedPromoter.balance - duration
    };

    if (!selectedPromoter.period1.start) {
        updates.period1 = { start: startStr, duration: duration };
    } else {
        updates.period2 = { start: startStr, duration: duration };
    }

    const { error } = await supabase
        .from('promoters')
        .update(updates)
        .eq('id', selectedPromoter.id);

    if (error) {
        setScheduleError('Erro ao salvar no banco: ' + error.message);
    } else {
        onRefresh();
        setIsScheduleModalOpen(false);
    }
  };

  const handleExportCSV = () => {
    const header = ["Cód.Func", "Funcionário", "Cidade", "Hieraequia", "Dt.Saida", "Dt.Retorno"];
    const rows: string[][] = [];
    promoters.forEach(p => {
        if (p.period1.start) rows.push([p.id.toString(), p.name, p.city, p.role, formatDate(p.period1.start), formatDate(getReturnDate(p.period1.start, p.period1.duration))]);
        if (p.period2.start) rows.push([p.id.toString(), p.name, p.city, p.role, formatDate(p.period2.start), formatDate(getReturnDate(p.period2.start, p.period2.duration))]);
    });
    if (rows.length === 0) { alert("Não há férias confirmadas para exportar."); return; }
    const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(row => row.map(item => `"${item}"`).join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Resumo_Ferias_Junco.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
      <ScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} promoter={selectedPromoter} onConfirm={validateAndSaveSchedule} error={scheduleError} />
      <CommunicationModal isOpen={isCommModalOpen} onClose={() => setIsCommModalOpen(false)} promoter={selectedPromoter} />
      <BulkCommunicationModal isOpen={isBulkCommModalOpen} onClose={() => setIsBulkCommModalOpen(false)} promoters={promoters} />

      <div className="bg-white border-b p-6 flex justify-between items-center shadow-sm z-10">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Férias</h1>
            <p className="text-sm text-gray-500">Gerencie e agende os períodos de descanso.</p>
         </div>
         <div className="flex gap-2 relative">
            <button 
              onClick={() => setIsBulkCommModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm mr-2"
            >
              <Megaphone size={16}/> Comunicado Regional
            </button>
            <input 
                className="pl-3 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Buscar por nome ou cidade..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
            />
            <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`px-3 border rounded-lg hover:bg-gray-50 transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-600'}`}
            >
                <FilterIcon size={16}/>
            </button>
            <button 
                onClick={handleExportCSV} 
                className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
                <Download size={16}/> Exportar
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                            <div className="flex items-center gap-1">Promotor {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30"/>}</div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('balance')}>
                            <div className="flex items-center justify-center gap-1">Dias Disp. {sortField === 'balance' ? (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30"/>}</div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-1">Status {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30"/>}</div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('dueDate')}>
                            <div className="flex items-center gap-1">Vencimento {sortField === 'dueDate' ? (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30"/>}</div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('limitDate')}>
                            <div className="flex items-center gap-1">Limite {sortField === 'limitDate' ? (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30"/>}</div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Comunicado</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                    {showFilters && (
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-2"><input className="w-full text-xs border rounded p-1" placeholder="Filtrar nome" value={columnFilters.promotor} onChange={e => setColumnFilters({...columnFilters, promotor: e.target.value})} /></th>
                            <th className="px-6 py-2"><input className="w-full text-xs border rounded p-1 text-center" placeholder="Dias" value={columnFilters.balance} onChange={e => setColumnFilters({...columnFilters, balance: e.target.value})} /></th>
                            <th className="px-6 py-2">
                                <select className="w-full text-xs border rounded p-1 bg-white" value={columnFilters.status} onChange={e => setColumnFilters({...columnFilters, status: e.target.value})}>
                                    <option value="">Todos</option>
                                    <option value="vencido">Vencido</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="negociacao">Negociação</option>
                                    <option value="avencer">A Vencer</option>
                                </select>
                            </th>
                            <th className="px-6 py-2"><input className="w-full text-xs border rounded p-1 text-center" placeholder="Data" value={columnFilters.dueDate} onChange={e => setColumnFilters({...columnFilters, dueDate: e.target.value})} /></th>
                            <th className="px-6 py-2"><input className="w-full text-xs border rounded p-1 text-center" placeholder="Data" value={columnFilters.limitDate} onChange={e => setColumnFilters({...columnFilters, limitDate: e.target.value})} /></th>
                            <th className="px-6 py-2"></th>
                            <th className="px-6 py-2"></th>
                        </tr>
                    )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredPromoters.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhum promotor encontrado.</td></tr>
                    ) : (
                        filteredPromoters.map(p => (
                            <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm text-gray-800">{p.name}</div>
                                    <div className="text-xs text-gray-500">{p.city}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.balance > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {p.balance}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={p.status} />
                                        {(p.status === 'vencido' || p.status === 'negociacao') && (
                                            <button onClick={() => toggleNegotiationStatus(p)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Trocar status">
                                                <ArrowRightLeft size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-medium tabular-nums">{formatDate(p.dueDate)}</td>
                                <td className="px-6 py-4 text-sm text-gray-700 tabular-nums">{formatDate(p.limitDate)}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleOpenComm(p)} 
                                        className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all"
                                    >
                                        <MessageSquare size={14}/> Texto
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {p.balance === 0 ? (
                                        <button onClick={() => handleDeleteVacation(p.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors">
                                            <Trash2 size={16}/>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleOpenSchedule(p)} 
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Agendar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};