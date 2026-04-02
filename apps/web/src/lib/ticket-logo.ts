import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function mimeFromPath(pathOrUrl: string): string {
  const ext = pathOrUrl.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg' || ext === 'svg+xml') return 'image/svg+xml';
  return 'image/png';
}

/** PDF görüntüleyici SVG’yi güvenilir göstermez; PNG/JPEG/WebP kullanın. */
function isRasterMime(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/gif';
}

/** Ayarlardaki logo URL’sini PDF Image için data URL’e çevirir. */
export async function resolveLogoDataUrlForPdf(logoUrl?: string | null): Promise<string | null> {
  const raw = logoUrl?.trim();
  if (!raw) return null;
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const res = await fetch(raw);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type')?.split(';')[0]?.trim();
      const mime = ct && ct.startsWith('image/') ? ct : mimeFromPath(raw);
      if (!isRasterMime(mime)) return null;
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
    if (raw.startsWith('/')) {
      const mime = mimeFromPath(raw);
      if (!isRasterMime(mime)) return null;
      const diskPath = join(process.cwd(), 'public', raw.replace(/^\//, ''));
      const buf = await readFile(diskPath);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  } catch {
    return null;
  }
  return null;
}
