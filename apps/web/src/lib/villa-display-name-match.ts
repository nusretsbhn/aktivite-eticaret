import type { AdminVilla } from '@/types/admin-villa';

/** Villa adı eşleştirmesi: trim + Türkçe büyük/küçük harf (i/İ) */
export function normalizeVillaDisplayName(s: string): string {
  return String(s ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR');
}

export type VillaMatchResult =
  | { ok: true; villa: AdminVilla }
  | { ok: false; reason: 'not_found' | 'ambiguous' };

/** JSON anahtarı ile paneldeki görünen adı eşleştir (büyük/küçük harf duyarsız). */
export function matchVillaByDisplayName(villas: AdminVilla[], nameKey: string): VillaMatchResult {
  const norm = normalizeVillaDisplayName(nameKey);
  if (!norm) return { ok: false, reason: 'not_found' };
  const matches = villas.filter((v) => normalizeVillaDisplayName(v.displayName) === norm);
  if (matches.length === 0) return { ok: false, reason: 'not_found' };
  if (matches.length > 1) return { ok: false, reason: 'ambiguous' };
  return { ok: true, villa: matches[0]! };
}
