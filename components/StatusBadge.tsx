import React from 'react';
import { PromoterStatus } from '../types';

interface StatusBadgeProps {
  status: PromoterStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    confirmado: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Confirmado' },
    negociacao: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Em Negociação' },
    vencido: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Vencido' },
    avencer: { color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'A Vencer' },
  };
  const style = config[status] || config.avencer;

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${style.color}`}>
      {style.label}
    </span>
  );
};