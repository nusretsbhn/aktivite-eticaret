const TR_MAP: Record<string, string> = {
  ğ: 'g',
  Ğ: 'g',
  ü: 'u',
  Ü: 'u',
  ş: 's',
  Ş: 's',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ç: 'c',
  Ç: 'c',
};

export function slugifyVillaTitle(text: string): string {
  let s = String(text ?? '').trim();
  for (const [a, b] of Object.entries(TR_MAP)) {
    s = s.split(a).join(b);
  }
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  return s.slice(0, 120);
}
