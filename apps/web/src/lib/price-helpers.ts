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
  const map = new Map<string, number>();
  for (const e of existing) map.set(e.date, e.price);
  for (const i of incoming) map.set(i.date, i.price);
  return [...map.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
