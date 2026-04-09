export type PromoterStatus = 'confirmado' | 'negociacao' | 'vencido' | 'avencer';

export interface Period {
  start: string | null;
  duration: number;
}

export interface Promoter {
  id: number;
  name: string;
  city: string;
  role: string;
  regional: string;
  admission: string;
  dueDate: string;
  limitDate: string;
  balance: number;
  status: PromoterStatus;
  period1: Period;
  period2: Period;
}

export type ViewState = 'dashboard' | 'management' | 'database' | 'calendar';

export interface ColumnFilters {
  promotor: string;
  balance: string;
  status: string;
  dueDate: string;
  limitDate: string;
}

// Helper to get a date string for N days from now
const getFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export const INITIAL_DB: Promoter[] = [
  { 
    id: 924, name: 'MARCIA MILENA SOUZA CORREA', city: 'SINOP - MT', role: 'COORD EVERTON', regional: 'CENTRO OESTE', admission: '2009-03-02', dueDate: '2025-03-02', limitDate: '2026-02-02', balance: 0, status: 'vencido', 
    period1: { start: null, duration: 0 }, period2: { start: null, duration: 0 }
  },
  { 
    id: 5926, name: 'LIVIA ESTER ANDRADE DOS SANTOS', city: 'GOIANIA - GO', role: 'COORD EVERTON', regional: 'CENTRO OESTE', admission: '2021-04-20', dueDate: '2025-04-20', limitDate: '2026-03-20', balance: 0, status: 'negociacao', 
    period1: { start: null, duration: 0 }, period2: { start: null, duration: 0 }
  },
  { 
    id: 754, name: 'FRANCISCA KATIA IRENE', city: 'TERESINA - PI', role: 'LIDER EVERTON', regional: 'NORDESTE', admission: '2018-05-10', dueDate: '2025-05-10', limitDate: '2026-05-10', balance: 15, status: 'confirmado', 
    period1: { start: getFutureDate(3), duration: 15 }, period2: { start: null, duration: 0 } 
  },
  { 
    id: 5905, name: 'DIEGO PAES DE PAULA', city: 'SAO PAULO - SP', role: 'LIDER DIEGO', regional: 'SÃO PAULO', admission: '2020-01-15', dueDate: '2025-01-15', limitDate: '2026-06-15', balance: 15, status: 'confirmado', 
    period1: { start: '2026-06-04', duration: 15 }, period2: { start: null, duration: 0 } 
  },
  { 
    id: 6096, name: 'ITALO BERNARDO DA SILVA', city: 'RIBEIRAO PRETO - SP', role: 'LIDER EVERTON', regional: 'SÃO PAULO', admission: '2023-09-23', dueDate: '2025-09-23', limitDate: '2026-08-23', balance: 30, status: 'vencido', 
    period1: { start: null, duration: 0 }, period2: { start: null, duration: 0 } 
  },
  { 
    id: 6100, name: 'JACKSON PEREIRA AUGUSTO', city: 'GUARULHOS - SP', role: 'LIDER DIEGO', regional: 'SÃO PAULO', admission: '2023-09-23', dueDate: '2025-09-23', limitDate: '2026-08-23', balance: 30, status: 'avencer', 
    period1: { start: null, duration: 0 }, period2: { start: null, duration: 0 } 
  },
];