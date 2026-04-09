import React from 'react';
import { LayoutGrid, List, Database, Calendar, LogOut } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300 h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <LayoutGrid className="text-blue-500 mr-3" />
        <span className="font-bold text-white text-lg">Junco Hub</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <LayoutGrid size={20} /> Visão Geral
        </button>
        <button
          onClick={() => setCurrentView('management')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            currentView === 'management' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <List size={20} /> Gestão de Férias
        </button>
        <button
          onClick={() => setCurrentView('database')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            currentView === 'database' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <Database size={20} /> Base de Dados
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            currentView === 'calendar' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <Calendar size={20} /> Calendário
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} /> Sair
        </button>
      </div>
    </div>
  );
};
