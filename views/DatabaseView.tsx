import React, { useState, useRef } from 'react';
import { UserPlus, Upload, Download, Edit2, Save, Trash2 } from 'lucide-react';
import { Promoter } from '../types';
import { formatDate } from '../utils';
import { AddPromoterModal } from '../components/Modals';
import { supabase } from '../supabase';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface DatabaseViewProps {
  promoters: Promoter[];
  setPromoters: React.Dispatch<React.SetStateAction<Promoter[]>>;
  onRefresh: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ promoters, setPromoters, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPromoterId, setEditingPromoterId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Promoter>>({});
  const [promoterToDelete, setPromoterToDelete] = useState<Promoter | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNew = async (newData: Omit<Promoter, 'id' | 'period1' | 'period2'>) => {
    const newPromoter = {
        ...newData,
        period1: { start: null, duration: 0 },
        period2: { start: null, duration: 0 }
    };

    const { error } = await supabase
      .from('promoters')
      .insert([newPromoter]);

    if (error) {
      toast.error('Erro ao adicionar promotor: ' + error.message);
    } else {
      toast.success('Promotor adicionado com sucesso!');
      onRefresh();
      setIsAddModalOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!promoterToDelete) return;
    
    const { error } = await supabase
      .from('promoters')
      .delete()
      .eq('id', promoterToDelete.id);
    
    if (error) {
      toast.error('Erro ao excluir: ' + error.message);
    } else {
      toast.success('Promotor excluído!');
      onRefresh();
    }
    setPromoterToDelete(null);
  };

  const handleDeletePromoter = (promoter: Promoter) => {
    setPromoterToDelete(promoter);
  };

  const handleStartEdit = (promoter: Promoter) => { 
      setEditingPromoterId(promoter.id); 
      setEditFormData({ ...promoter }); 
  };
  
  const handleSaveEdit = async () => { 
      if (!editingPromoterId) return;

      const { error } = await supabase
        .from('promoters')
        .update(editFormData)
        .eq('id', editingPromoterId);

      if (error) {
        toast.error('Erro ao salvar edição: ' + error.message);
      } else {
        toast.success('Alterações salvas!');
        onRefresh();
        setEditingPromoterId(null); 
      }
  };

  const handleExportBaseCSV = () => {
    const header = ["ID", "Nome", "Cidade", "Regional", "Cargo", "Admissão", "Vencimento", "Data Limite", "Saldo Dias", "Status"];
    const rows = promoters.map(p => [
        p.id, p.name, p.city, p.regional, p.role, formatDate(p.admission), formatDate(p.dueDate), formatDate(p.limitDate), p.balance, p.status
    ]);
    if (rows.length === 0) { toast.error("Base de dados vazia."); return; }
    const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(row => row.map(item => `"${item}"`).join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Base_Completa_Promotores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = String(dateStr).trim();
    // Tenta formato DD/MM/YYYY
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) return `${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`;
    }
    // Assume que já está em YYYY-MM-DD ou retorna como está
    return cleanStr;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const rows = results.data as any[];
            
            // Helper para encontrar a chave ignorando maiúsculas/minúsculas e acentos
            const getValue = (row: any, possibleKeys: string[]) => {
                const normalizedRow = Object.keys(row).reduce((acc, key) => {
                    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    acc[normalizedKey] = row[key];
                    return acc;
                }, {} as any);

                for (const pk of possibleKeys) {
                    const normalizedPk = pk.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    if (normalizedRow[normalizedPk] !== undefined) {
                        return normalizedRow[normalizedPk];
                    }
                }
                return null;
            };

            const promotersToInsert = rows.map(row => ({
                name: getValue(row, ['Nome', 'Promotor']),
                city: getValue(row, ['Cidade', 'Base', 'Local']) || '',
                regional: getValue(row, ['Regional', 'Regiao']) || '',
                role: getValue(row, ['Cargo', 'Funcao']) || '',
                admission: parseDate(getValue(row, ['Admissao', 'Data Admissao', 'Data de Admissao'])),
                dueDate: parseDate(getValue(row, ['Vencimento', 'Data Vencimento', 'Data de Vencimento', 'Vencimento Ferias', 'Vencimento de Ferias', 'Venc'])),
                limitDate: parseDate(getValue(row, ['Limite', 'Limite Ferias', 'Data Limite'])),
                balance: parseInt(getValue(row, ['Saldo', 'Saldo Dias', 'Dias']) || '30'),
                status: 'avencer',
                period1: { start: null, duration: 0 },
                period2: { start: null, duration: 0 }
            })).filter(p => p.name); // Garante que tem nome

            if (promotersToInsert.length === 0) {
                toast.error('Nenhum dado válido encontrado no CSV.');
                return;
            }

            const { error } = await supabase
                .from('promoters')
                .insert(promotersToInsert);

            if (error) {
                toast.error('Erro na importação: ' + error.message);
            } else {
                toast.success(`${promotersToInsert.length} promotores importados!`);
                onRefresh();
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
            toast.error('Erro ao ler CSV: ' + error.message);
        }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
        <AddPromoterModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddNew} />
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
        />
        
        <div className="bg-white border-b p-6 flex justify-between items-center shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Base de Dados</h1>
                <p className="text-gray-500 text-sm">Cadastro mestre de promotores e edição de registros.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                    <UserPlus size={16}/> Novo
                </button>
                <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors">
                    <Upload size={16}/> Importar CSV
                </button>
                <button onClick={handleExportBaseCSV} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors">
                    <Download size={16}/> Exportar Base
                </button>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Cód', 'Nome', 'Cidade', 'Regional', 'Cargo', 'Admissão', 'Vencimento', 'Limite', 'Saldo', 'Ações'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {promoters.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.id}</td>
                                <td className="px-4 py-3">
                                    {editingPromoterId === p.id ? <input className="border rounded px-2 py-1 w-full text-sm" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} /> : <span className="text-sm font-bold text-gray-700">{p.name}</span>}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {editingPromoterId === p.id ? <input className="border rounded px-2 py-1 w-full text-xs" value={editFormData.city} onChange={e => setEditFormData({...editFormData, city: e.target.value})} /> : p.city}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {editingPromoterId === p.id ? <input className="border rounded px-2 py-1 w-full text-xs" value={editFormData.regional} onChange={e => setEditFormData({...editFormData, regional: e.target.value})} /> : p.regional}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {editingPromoterId === p.id ? <input className="border rounded px-2 py-1 w-full text-xs" value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} /> : p.role}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.admission)}</td>
                                <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                                    {editingPromoterId === p.id ? <input type="date" className="border rounded px-1" value={editFormData.dueDate} onChange={e => setEditFormData({...editFormData, dueDate: e.target.value})} /> : formatDate(p.dueDate)}
                                </td>
                                <td className="px-4 py-3 text-xs text-red-600 font-bold tabular-nums">
                                    {editingPromoterId === p.id ? <input type="date" className="border rounded px-1" value={editFormData.limitDate} onChange={e => setEditFormData({...editFormData, limitDate: e.target.value})} /> : formatDate(p.limitDate)}
                                </td>
                                <td className="px-4 py-3 text-xs font-bold text-center">
                                    {editingPromoterId === p.id ? (
                                        <input type="number" className="border rounded px-1 w-12 text-center" value={editFormData.balance} onChange={e => setEditFormData({...editFormData, balance: parseInt(e.target.value)})} />
                                    ) : (
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{p.balance}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                    {editingPromoterId === p.id ? (
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors"><Save size={16}/></button>
                                    ) : (
                                        <button onClick={() => handleStartEdit(p)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit2 size={16}/></button>
                                    )}
                                    <button onClick={() => handleDeletePromoter(p)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {promoterToDelete && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
                    <p className="text-gray-600 mb-6">
                        Tem certeza que deseja excluir o promotor <strong>{promoterToDelete.name}</strong> da base de dados? Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setPromoterToDelete(null)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
