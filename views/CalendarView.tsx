import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Promoter } from '../types';
import { addDays } from '../utils';

interface CalendarViewProps {
  promoters: Promoter[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ promoters }) => {
  const [calendarDate, setCalendarDate] = useState(new Date()); // Start at current date for better UX

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const renderDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const blanks = [...Array(startDay)].map((_, i) => <div key={`b-${i}`} className="bg-gray-50/50 min-h-[100px] border-r border-b border-gray-100"/>);
    
    const days = [...Array(daysInMonth)].map((_, i) => {
        const day = i + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const active = promoters.filter(p => {
            const check = (s: string | null, d: number) => { 
                if(!s) return false; 
                const end = addDays(s, d); 
                return dateStr >= s && dateStr < end; 
            };
            return check(p.period1.start, p.period1.duration) || check(p.period2.start, p.period2.duration);
        });

        const hasActive = active.length > 0;

        return (
            <div key={day} className={`bg-white p-2 min-h-[100px] border-r border-b border-gray-100 transition-colors hover:bg-gray-50 ${hasActive ? 'bg-orange-50' : ''}`}>
                <span className={`text-sm font-bold ${hasActive ? 'text-orange-700' : 'text-gray-700'}`}>{day}</span>
                <div className="mt-2 space-y-1 overflow-hidden">
                    {active.map(p => (
                        <div key={p.id} className="text-[10px] border border-orange-200 px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 truncate shadow-sm font-medium">
                            {p.name.split(' ')[0]}
                        </div>
                    ))}
                </div>
            </div>
        );
    });

    return [...blanks, ...days];
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-8 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
            <div className="flex items-center gap-4 bg-white border rounded-xl px-4 py-2 shadow-sm">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                <span className="font-bold text-gray-800 w-32 text-center">{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20}/></button>
            </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                    <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 tracking-wider">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-100 gap-px overflow-y-auto custom-scrollbar">
                {renderDays()}
            </div>
        </div>
    </div>
  );
};