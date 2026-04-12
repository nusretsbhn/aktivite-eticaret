import type { PriceEntry } from '@/types/admin-activity';

export function expandDateRange(from: string, to: string, price: number): PriceEntry[] {
  const out: PriceEntry[] = [];
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return out;
  }
  const d = new Date(start);
  while (d <= end) {
    out.push({ date: d.toISOString().slice(0, 10), price });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function mergePricesByDate(existing: PriceEntry[], incoming: PriceEntry[]): PriceEntry[] {
  const map = new Map<string, PriceEntry>();
  for (const e of existing) map.set(e.date, { ...e });
  for (const i of incoming) {
    const prev = map.get(i.date);
    map.set(i.date, {
      date: i.date,
      price: i.price,
      priceChild: i.priceChild !== undefined ? i.priceChild : prev?.priceChild,
      priceInfant: i.priceInfant !== undefined ? i.priceInfant : prev?.priceInfant,
    });
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Aktivite fiyat aralığı: her güne aynı üçlü fiyat uygulanır. */
export function expandActivityPriceRange(
  from: string,
  to: string,
  triple: { price: number; priceChild: number; priceInfant: number },
): PriceEntry[] {
  const out: PriceEntry[] = [];
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return out;
  }
  const d = new Date(start);
  while (d <= end) {
    const date = d.toISOString().slice(0, 10);
    out.push({
      date,
      price: triple.price,
      priceChild: triple.priceChild,
      priceInfant: triple.priceInfant,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
