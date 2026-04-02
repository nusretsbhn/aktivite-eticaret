import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { getPublicSearchDirs } from '@/lib/next-public-dir';

function contentTypeByPath(pathname: string): string {
  const low = pathname.toLowerCase();
  if (low.endsWith('.jpg') || low.endsWith('.jpeg')) return 'image/jpeg';
  if (low.endsWith('.png')) return 'image/png';
  if (low.endsWith('.webp')) return 'image/webp';
  if (low.endsWith('.gif')) return 'image/gif';
  if (low.endsWith('.avif')) return 'image/avif';
  if (low.endsWith('.svg')) return 'image/svg+xml';
  if (low.endsWith('.mp4')) return 'video/mp4';
  if (low.endsWith('.webm')) return 'video/webm';
  if (low.endsWith('.mov')) return 'video/quicktime';
  if (low.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

type Ctx = { params: Promise<{ parts: string[] }> };

export async function GET(_request: Request, context: Ctx) {
  const { parts } = await context.params;
  const safeParts = (parts ?? []).filter((p) => p && !p.includes('..'));
  if (!safeParts.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rel = join(...safeParts);

  for (const base of getPublicSearchDirs()) {
    const full = join(base, rel);
    try {
      const buf = await readFile(full);
      return new NextResponse(buf, {
        headers: {
          'Content-Type': contentTypeByPath(full),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
