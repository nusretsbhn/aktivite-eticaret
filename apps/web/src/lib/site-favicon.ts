import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { readSettings } from '@/lib/admin-settings-server';
import { getPublicSearchDirs } from '@/lib/next-public-dir';

export type SiteFaviconAsset = {
  buffer: Buffer;
  contentType: string;
};

function mimeFromPath(pathOrUrl: string): string {
  const ext = pathOrUrl.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg' || ext === 'svg+xml') return 'image/svg+xml';
  if (ext === 'ico') return 'image/x-icon';
  return 'image/png';
}

async function readLocalUpload(relPath: string): Promise<SiteFaviconAsset | null> {
  const rel = relPath.replace(/^\//, '');
  const mime = mimeFromPath(relPath);
  for (const base of getPublicSearchDirs()) {
    const full = join(base, rel);
    try {
      const buffer = await readFile(full);
      return { buffer, contentType: mime };
    } catch {
      /* sonraki dizin */
    }
  }
  return null;
}

/** Site Yönetimi’ndeki normal logo (logoUrl) — tarayıcı sekmesi favicon’u. */
export async function loadSiteFavicon(): Promise<SiteFaviconAsset | null> {
  let logoUrl = '';
  try {
    const settings = await readSettings();
    logoUrl = settings.siteManagement?.logoUrl?.trim() ?? '';
  } catch {
    return null;
  }
  if (!logoUrl) return null;

  try {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      const res = await fetch(logoUrl, { cache: 'no-store' });
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type')?.split(';')[0]?.trim();
      const contentType = ct && ct.startsWith('image/') ? ct : mimeFromPath(logoUrl);
      return { buffer, contentType };
    }
    if (logoUrl.startsWith('/')) {
      return readLocalUpload(logoUrl);
    }
  } catch {
    return null;
  }
  return null;
}
