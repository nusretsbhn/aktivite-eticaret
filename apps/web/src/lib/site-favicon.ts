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

async function loadImageAsset(imageUrl: string): Promise<SiteFaviconAsset | null> {
  const url = imageUrl.trim();
  if (!url) return null;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type')?.split(';')[0]?.trim();
      const contentType = ct && ct.startsWith('image/') ? ct : mimeFromPath(url);
      return { buffer, contentType };
    }
    if (url.startsWith('/')) {
      return readLocalUpload(url);
    }
  } catch {
    return null;
  }
  return null;
}

/** Site Yönetimi faviconUrl; yoksa logoUrl — tarayıcı sekmesi ikonu. */
export async function loadSiteFavicon(): Promise<SiteFaviconAsset | null> {
  try {
    const settings = await readSettings();
    const sm = settings.siteManagement;
    const faviconUrl = sm?.faviconUrl?.trim() ?? '';
    const logoUrl = sm?.logoUrl?.trim() ?? '';
    const source = faviconUrl || logoUrl;
    if (!source) return null;
    return loadImageAsset(source);
  } catch {
    return null;
  }
}
