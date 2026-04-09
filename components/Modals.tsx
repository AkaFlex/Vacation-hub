import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Megaphone } from 'lucide-react';
import { Promoter, PromoterStatus } from '../types';
import { formatDate, getReturnDate, addDays } from '../utils';
import { StatusBadge } from './StatusBadge';

// --- Leader Details Modal ---
interface LeaderDetailsModalProps {
  selectedLeader: string | null;
  onClose: () => void;
  promoters: Promoter[];
}

export const LeaderDetailsModal: React.FC<LeaderDetailsModalProps> = ({ selectedLeader, onClose, promoters }) => {
  if (!selectedLeader) return null;
  const leaderPromoters = promoters.filter(p => p.role === selectedLeader);
  const onVacation = leaderPromoters.filter(p => p.status === 'confirmado');
  const others = leaderPromoters.filter(p => p.status !== 'confirmado');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
          <h3 className="font-bold text-gray-800">{selectedLeader}</h3>
          <button onClick={onClose} className="hover:text-red-500 transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Em Férias / Agendados ({onVacation.length})</h4>
          <div className="space-y-2 mb-6">
            {onVacation.map(p => (
              <div key={p.id} className="flex justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="text-sm font-bold text-green-900">{p.name}</div>
                <div className="text-xs text-green-700">{formatDate(p.period1.start || p.period2.start)}</div>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Pendências ({others.length})</h4>
          <div className="space-y-2">
            {others.map(p => (
              <div key={p.id} className="flex justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-sm text-gray-700">{p.name}</div>
                <StatusBadge status={p.status}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Add Promoter Modal ---
interface AddPromoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Promoter, 'id' | 'period1' | 'period2'>) => void;
}

export const AddPromoterModal: React.FC<AddPromoterModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ 
    name: '', city: '', regional: '', role: '', 
    admission: '', dueDate: '', limitDate: '', balance: 30, status: 'avencer' as PromoterStatus 
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-gray-800">Novo Promotor</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
          <input className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Regional" value={formData.regional} onChange={e => setFormData({...formData, regional: e.target.value})} />
          <input className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cargo/Líder" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
          <div>
            <label className="text-xs text-gray-500">Admissão</label>
            <input type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none" value={formData.admission} onChange={e => setFormData({...formData, admission: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Vencimento</label>
            <input type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Limite Férias</label>
            <input type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none" value={formData.limitDate} onChange={e => setFormData({...formData, limitDate: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Saldo Dias</label>
            <input type="number" className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Saldo Dias" value={formData.balance} onChange={e => setFormData({...formData, balance: parseInt(e.target.value)})} />
          </div>
          
          <button 
            onClick={() => onSave(formData)} 
            className="col-span-1 md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm mt-2"
          >
            Salvar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Schedule Modal ---
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoter: Promoter | null;
  onConfirm: (startDate: string, duration: number) => void;
  error: string | null;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, promoter, onConfirm, error }) => {
  const [scheduleForm, setScheduleForm] = useState({ startDate: '', duration: 15 });

  useEffect(() => {
    if (promoter) {
        setScheduleForm({ startDate: '', duration: promoter.balance > 15 ? 15 : promoter.balance });
    }
  }, [promoter, isOpen]);

  if (!isOpen || !promoter) return null;

  const previewReturnDate = scheduleForm.startDate ? getReturnDate(scheduleForm.startDate, scheduleForm.duration) : '-';
  const usedPeriods = (promoter.period1.start ? 1 : 0) + (promoter.period2.start ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold">Agendar Férias</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{promoter.name}</p>
              <p className="text-xs text-gray-500">Saldo atual: <span className="font-bold">{promoter.balance} dias</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Períodos agendados:</p>
              <p className={`font-bold ${usedPeriods === 2 ? 'text-red-600' : 'text-blue-600'}`}>{usedPeriods} / 2</p>
            </div>
          </div>
          {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100 flex items-start gap-2"><span>⚠️</span>{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Início</label>
              <input 
                type="date" 
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                value={scheduleForm.startDate} 
                onChange={(e) => setScheduleForm({...scheduleForm, startDate: e.target.value})}
                disabled={usedPeriods === 2 || promoter.balance === 0}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Duração (dias)</label>
              <input 
                type="number" 
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                value={scheduleForm.duration} 
                onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value)})}
                disabled={usedPeriods === 2 || promoter.balance === 0}
              />
            </div>
          </div>
          <div className="mt-6 text-center text-sm bg-blue-50 p-3 rounded-lg text-blue-900">
            Retorno estimado: <b className="text-blue-700">{scheduleForm.startDate ? formatDate(previewReturnDate) : '-'}</b>
          </div>
          <button 
            onClick={() => onConfirm(scheduleForm.startDate, scheduleForm.duration)} 
            disabled={usedPeriods === 2 || promoter.balance === 0}
            className="mt-6 w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            Confirmar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Communication Modal ---
interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoter: Promoter | null;
}

export const CommunicationModal: React.FC<CommunicationModalProps> = ({ isOpen, onClose, promoter }) => {
  const [commType, setCommType] = useState('confirmacao');
  const [targetPeriod, setTargetPeriod] = useState('both');

  const hasP1 = promoter?.period1?.start ? true : false;
  const hasP2 = promoter?.period2?.start ? true : false;
  const pStatus = promoter?.status;

  useEffect(() => {
    if (!isOpen || !promoter) return;

    if (hasP1 && hasP2) setTargetPeriod('both');
    else if (hasP1) setTargetPeriod('p1');
    else if (hasP2) setTargetPeriod('p2');
    else setTargetPeriod('none');

    if (pStatus === 'vencido' || pStatus === 'negociacao') setCommType('comercial');
    else setCommType('confirmacao');
  }, [isOpen, promoter, hasP1, hasP2, pStatus]);

  if (!isOpen || !promoter) return null;

  const generateMessage = () => {
    if (!promoter) return '';
    const p1 = promoter.period1;
    const p2 = promoter.period2;
    const includeP1 = (targetPeriod === 'p1' || targetPeriod === 'both') && !!p1.start;
    const includeP2 = (targetPeriod === 'p2' || targetPeriod === 'both') && !!p2.start;

    if (commType === 'comercial') {
        let periodMsg = "";
        if (promoter.balance === 30) {
            periodMsg = "Lembrando que ele possui 30 dias de saldo, sendo necessário marcar *DOIS* períodos de 15 dias (ou um período completo de 30 dias).";
        } else if (promoter.balance === 15) {
            periodMsg = "Lembrando que ele possui 15 dias de saldo, sendo necessário marcar apenas *UM* período de 15 dias.";
        } else {
            periodMsg = `Lembrando que ele possui ${promoter.balance} dias de saldo para serem agendados.`;
        }

        return `Bom dia time, tudo bem?\n\nEstamos com um promotor que está com férias vencidas e precisamos marcá-las. Segue abaixo o promotor:\n\n*${promoter.name}*\n${promoter.city}\n\n${periodMsg}`;
    }
    if (commType === 'confirmacao') {
        let text = "";
        if (includeP1) text += `*Primeiro Período:*\n*Início:* ${formatDate(p1.start)}\n*Término:* ${formatDate(addDays(p1.start!, p1.duration - 1))}\n*Retorno:* _${formatDate(getReturnDate(p1.start!, p1.duration))}_\n\n`;
        if (includeP2) text += `*Segundo Período:*\n*Início:* ${formatDate(p2.start)}\n*Término:* ${formatDate(addDays(p2.start!, p2.duration - 1))}\n*Retorno:* _${formatDate(getReturnDate(p2.start!, p2.duration))}_`;
        if (!text) return "Selecione um período.";
        return `🤖*MENSAGEM AUTOMÁTICA*🤖\n\nCaro(a) colaborador(a), seus períodos de férias foram agendados com sucesso para as seguintes datas:\n\n${text}\nPara acompanhar, basta acessar o aplicativo *_Pessoas+_*`;
    }
    const activeStart = includeP1 ? p1.start : (includeP2 ? p2.start : null);
    const activeDur = includeP1 ? p1.duration : (includeP2 ? p2.duration : 0);
    if (!activeStart) return "Selecione um período agendado.";
    
    if (commType === 'lembrete') return `Prezado,\n\nGostaríamos de informar que suas férias se iniciam no dia ${formatDate(activeStart)} e seu retorno às atividades será no dia ${formatDate(getReturnDate(activeStart, activeDur))}.\n\nDesejamos boas férias!`;
    if (commType === 'lideranca') return `Bom dia time, tudo bem?\n\nGostaríamos de informar que o promotor *${promoter.name}* (${promoter.city}) entrará em férias em breve.\n\n*Início:* ${formatDate(activeStart)}\n*Retorno:* ${formatDate(getReturnDate(activeStart, activeDur))}\n\nFavor se atentarem a este período.`;
    return '';
  };

  const message = generateMessage();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare size={18} className="text-blue-600"/> Comunicado</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6">
           {(hasP1 || hasP2) && commType !== 'comercial' && (
             <div className="mb-4 flex gap-2">
               {hasP1 && <button onClick={() => setTargetPeriod('p1')} className={`px-3 py-1 text-xs border rounded transition-colors ${targetPeriod==='p1'?'bg-blue-600 text-white shadow-sm':'hover:bg-gray-50'}`}>1º Período</button>}
               {hasP2 && <button onClick={() => setTargetPeriod('p2')} className={`px-3 py-1 text-xs border rounded transition-colors ${targetPeriod==='p2'?'bg-blue-600 text-white shadow-sm':'hover:bg-gray-50'}`}>2º Período</button>}
               {hasP1 && hasP2 && <button onClick={() => setTargetPeriod('both')} className={`px-3 py-1 text-xs border rounded transition-colors ${targetPeriod==='both'?'bg-blue-600 text-white shadow-sm':'hover:bg-gray-50'}`}>Ambos</button>}
             </div>
           )}
           <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
             {['comercial', 'confirmacao', 'lembrete', 'lideranca'].map(type => (
               <button key={type} onClick={() => setCommType(type)} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors whitespace-nowrap ${commType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{type}</button>
             ))}
           </div>
           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm font-mono whitespace-pre-wrap h-64 overflow-y-auto custom-scrollbar text-gray-700">
             {message}
           </div>
           <button 
            onClick={() => {navigator.clipboard.writeText(message); alert('Texto copiado!'); onClose();}} 
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
           >
             Copiar Texto
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Bulk Communication Modal ---
interface BulkCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoters: Promoter[];
}

export const BulkCommunicationModal: React.FC<BulkCommunicationModalProps> = ({ isOpen, onClose, promoters }) => {
  const [selectedRegional, setSelectedRegional] = useState<string>('');
  const [selectedBalance, setSelectedBalance] = useState<number | ''>('');

  // Get unique regionals that have promoters with balance > 0 and pending vacation
  const availablePromoters = promoters.filter(p => p.balance > 0 && (p.status === 'vencido' || p.status === 'negociacao' || p.status === 'avencer'));
  const regionals = Array.from(new Set(availablePromoters.map(p => p.regional))).filter(Boolean).sort();

  // Reset balance when regional changes
  useEffect(() => {
    setSelectedBalance('');
  }, [selectedRegional]);

  const balances = selectedRegional
    ? Array.from(new Set(availablePromoters.filter(p => p.regional === selectedRegional).map(p => p.balance))).sort((a, b) => b - a)
    : [];

  const filteredPromoters = availablePromoters.filter(p => p.regional === selectedRegional && p.balance === selectedBalance);

  const generateMessage = () => {
    if (!selectedRegional || selectedBalance === '') return 'Selecione uma regional e um saldo de dias para gerar a mensagem.';
    if (filteredPromoters.length === 0) return 'Nenhum promotor encontrado com estes filtros.';

    let periodMsg = "";
    if (selectedBalance === 30) {
        periodMsg = "Lembrando que eles possuem 30 dias de saldo, sendo necessário marcar *DOIS* períodos de 15 dias (ou um período completo de 30 dias).";
    } else if (selectedBalance === 15) {
        periodMsg = "Lembrando que eles possuem 15 dias de saldo, sendo necessário marcar apenas *UM* período de 15 dias.";
    } else {
        periodMsg = `Lembrando que eles possuem ${selectedBalance} dias de saldo para serem agendados.`;
    }

    const promotersList = filteredPromoters.map(p => `* ${p.name} (${p.city})`).join('\n');

    return `Bom dia time, tudo bem?\n\nEstamos com promotores da regional *${selectedRegional}* que estão com férias pendentes e precisamos marcá-las. Segue abaixo a lista:\n\n${promotersList}\n\n${periodMsg}`;
  };

  const message = generateMessage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18} className="text-blue-600"/> Comunicado Regional</h3>
          <button onClick={onClose} className="hover:text-red-500 transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-2 gap-4 mb-4">
             <div>
               <label className="text-xs font-bold text-gray-600 block mb-1">Regional</label>
               <select 
                 className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                 value={selectedRegional} 
                 onChange={e => setSelectedRegional(e.target.value)}
               >
                 <option value="">Selecione...</option>
                 {regionals.map(r => <option key={r} value={r}>{r}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-600 block mb-1">Saldo de Dias</label>
               <select 
                 className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                 value={selectedBalance} 
                 onChange={e => setSelectedBalance(Number(e.target.value))} 
                 disabled={!selectedRegional}
               >
                 <option value="">Selecione...</option>
                 {balances.map(b => <option key={b} value={b}>{b} dias</option>)}
               </select>
             </div>
           </div>
           
           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm font-mono whitespace-pre-wrap h-64 overflow-y-auto custom-scrollbar text-gray-700">
             {message}
           </div>
           <button 
            onClick={() => {navigator.clipboard.writeText(message); alert('Texto copiado!'); onClose();}} 
            disabled={!selectedRegional || selectedBalance === '' || filteredPromoters.length === 0}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
           >
             Copiar Texto
           </button>
        </div>
      </div>
    </div>
  );
};