/** Open Graph / metadataBase ve mutlak URL’ler için site kökü. */
export function getSiteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of candidates) {
    const v = raw?.trim();
    if (!v) continue;
    try {
      return new URL(v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`);
    } catch {
      /* sonraki aday */
    }
  }

  return new URL('http://localhost:3000');
}

/** Ayarlardaki logo yolu için mutlak URL (metadata / OG). */
export function toAbsoluteSiteUrl(pathOrUrl: string, base = getSiteUrl()): string {
  const raw = pathOrUrl.trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return new URL(raw, base).href;
  return new URL(`/${raw}`, base).href;
}
