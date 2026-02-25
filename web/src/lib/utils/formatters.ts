function safeDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  const d = safeDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatShortDate(date: string | Date | null | undefined): string {
  const d = safeDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const d = safeDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
