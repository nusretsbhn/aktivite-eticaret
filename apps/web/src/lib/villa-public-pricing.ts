import type { AdminVilla, VillaPaymentCurrency } from '@/types/admin-villa';

/** Yerel takvim günü YYYY-MM-DD */
export function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currencySymbol(c: VillaPaymentCurrency): string {
  switch (c) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '₺';
  }
}

/** Bugün için tanımlı gecelik fiyat; yoksa null */
export function getNightlyPriceForDate(villa: AdminVilla, isoDate: string): number | null {
  const row = villa.prices.find((p) => p.date === isoDate);
  if (!row || !Number.isFinite(row.price)) return null;
  return row.price;
}

export function formatVillaPrice(amount: number, currency: VillaPaymentCurrency): string {
  const sym = currencySymbol(currency);
  const n = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount);
  return `${n} ${sym}`;
}
