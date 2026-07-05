export const formatCurrency = (v: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v) + ' FC';

export const formatDate = (d: string) =>
  new Intl.DateTimeFormat('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d));

export const formatShortDate = (d: string) =>
  new Intl.DateTimeFormat('fr-CD', { day: 'numeric', month: 'short' }).format(new Date(d));

export const formatTime = (d: string) =>
  new Intl.DateTimeFormat('fr-CD', { hour: '2-digit', minute: '2-digit' }).format(new Date(d));