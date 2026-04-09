export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const getReturnDate = (dateStr: string, days: number): string => {
  return addDays(dateStr, days); 
};