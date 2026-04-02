import { mergeAvailabilityByDate, removeAvailabilityDates } from '@/lib/availability-helpers';
import { mergePricesByDate } from '@/lib/price-helpers';
import type { AvailabilityEntry, PriceEntry } from '@/types/admin-activity';

/** Eski paneldeki müsait / boş gibi değerleri tanır. */
export function isLegacyMusait(value: unknown): boolean {
  if (value == null) return true;
  const s = String(value).toLowerCase().trim();
  if (s === '' || s === 'null') return true;
  return (
    s === 'musait' ||
    s === 'müsait' ||
    s === 'available' ||
    s === 'bos' ||
    s === 'boş' ||
    s === 'empty'
  );
}

function legacyAvailabilityRowEffect(
  inStatus: unknown,
  outStatus: unknown,
): 'clear' | 'full' {
  const inOk = isLegacyMusait(inStatus);
  const outOk = outStatus == null || isLegacyMusait(outStatus);
  if (inOk && outOk) return 'clear';
  return 'full';
}

export type LegacyAvailabilityImportResult = {
  blocked: AvailabilityEntry[];
  clearedDates: string[];
  /** Dosyada geçen tüm günler (birleştir / değiştir modu için) */
  datesInFile: string[];
};

/** Eski `availability.json` dizisi → dolu günler + müsait günlerde kayıt silinecek tarihler */
export function parseLegacyAvailabilityJson(parsed: unknown): LegacyAvailabilityImportResult {
  const blocked: AvailabilityEntry[] = [];
  const clearedDates: string[] = [];
  const datesInFile: string[] = [];
  if (!Array.isArray(parsed)) {
    return { blocked: [], clearedDates: [], datesInFile: [] };
  }
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const day = String(o.day ?? o.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    datesInFile.push(day);
    const eff = legacyAvailabilityRowEffect(o.in_status, o.out_status);
    if (eff === 'clear') clearedDates.push(day);
    else blocked.push({ date: day, status: 'full' });
  }
  return {
    blocked: mergeAvailabilityByDate([], blocked),
    clearedDates,
    datesInFile: [...new Set(datesInFile)].sort((a, b) => a.localeCompare(b)),
  };
}

/** Eski `prices.json` dizisi */
export function parseLegacyPricesJson(parsed: unknown): PriceEntry[] {
  if (!Array.isArray(parsed)) return [];
  const items: PriceEntry[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const date = String(o.day ?? o.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const price = Number(o.price);
    if (!Number.isFinite(price) || price < 0) continue;
    items.push({ date, price });
  }
  return mergePricesByDate([], items);
}

export function applyLegacyPrices(
  existing: PriceEntry[],
  imported: PriceEntry[],
  mode: 'merge' | 'replace',
): PriceEntry[] {
  if (mode === 'replace') return imported;
  return mergePricesByDate(existing, imported);
}

/** Müsaitlik: `merge` = mevcut + dosya; `replace` = dosyada geçen tarihlerde eski kayıt silinip dosyadaki durum uygulanır. */
export function applyLegacyAvailability(
  existing: AvailabilityEntry[],
  result: LegacyAvailabilityImportResult,
  mode: 'merge' | 'replace',
): AvailabilityEntry[] {
  if (result.datesInFile.length === 0) return existing;

  let base = existing;
  if (mode === 'replace') {
    const drop = new Set(result.datesInFile);
    base = existing.filter((e) => !drop.has(e.date));
  }

  let next = removeAvailabilityDates(base, result.clearedDates);
  next = mergeAvailabilityByDate(next, result.blocked);
  return next;
}
