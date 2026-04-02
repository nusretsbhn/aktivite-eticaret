/** URL-safe kısa kimlik üretir (Türkçe harfler sadeleştirilir). */
export function slugifyId(name: string): string {
  const t = name
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return t.slice(0, 48) || 'oge';
}

export function uniqueSlug(base: string, used: Set<string>): string {
  let id = base || 'oge';
  let n = 0;
  while (used.has(id)) {
    n += 1;
    id = `${base}-${n}`;
  }
  return id;
}
