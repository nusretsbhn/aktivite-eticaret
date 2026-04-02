const MAP: Record<string, string> = {
  ı: 'i',
  İ: 'i',
  I: 'i',
  ş: 's',
  Ş: 's',
  ğ: 'g',
  Ğ: 'g',
  ü: 'u',
  Ü: 'u',
  ö: 'o',
  Ö: 'o',
  ç: 'c',
  Ç: 'c',
};

export function slugifyTr(input: string): string {
  let s = input.trim();
  for (const [k, v] of Object.entries(MAP)) {
    s = s.split(k).join(v);
  }
  s = s.toLowerCase();
  return s
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'yazi';
}

export function uniqueSlug(base: string, existing: Set<string>): string {
  const slug = base || 'yazi';
  if (!existing.has(slug)) return slug;
  let n = 2;
  while (existing.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}
