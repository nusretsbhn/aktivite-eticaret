import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { formDataBlobName, getFormDataBlob } from '@/lib/form-data-file';
import { getUploadsDir } from '@/lib/next-public-dir';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import type { GalleryItem } from '@/types/admin-activity';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const ALLOWED_VIDEO_EXT = /\.(mp4|webm|mov)$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminSession();
    if (!session) return unauthorized();

    const { id } = await context.params;
    const all = await readVillas();
    const idx = all.findIndex((v) => v.id === id);
    if (idx === -1) return notFound();

    const form = await request.formData();
    const blob = getFormDataBlob(form.get('file'));
    if (!blob || blob.size === 0) {
      return NextResponse.json({ error: 'Dosya gerekli.' }, { status: 400 });
    }

    const mime = blob.type.toLowerCase();
    const filename = formDataBlobName(blob);
    let isImage = ALLOWED_IMAGE_MIME.has(mime);
    let isVideo = ALLOWED_VIDEO_MIME.has(mime);
    if (!isImage && !isVideo) {
      isImage = ALLOWED_IMAGE_EXT.test(filename);
      isVideo = ALLOWED_VIDEO_EXT.test(filename);
    }
    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Desteklenmeyen format. JPG, PNG, WEBP, GIF, AVIF veya MP4/WEBM/MOV yükleyin.' },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await blob.arrayBuffer());
    const villa = all[idx];
    if (!villa) return notFound();

    const uploadDir = join(getUploadsDir(), 'uploads', 'villas', villa.id);
    await mkdir(uploadDir, { recursive: true });
    const storedName = `${Date.now()}-${safeFilename(filename)}`;
    await writeFile(join(uploadDir, storedName), buf);

    const publicUrl = `/uploads/villas/${villa.id}/${storedName}`;
    const galleryItem: GalleryItem = {
      id: randomUUID(),
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
      sortOrder: villa.gallery.length,
      isCover: villa.gallery.length === 0,
    };

    const g = villa.gallery ?? [];
    villa.gallery = [...g, galleryItem];
    villa.updatedAt = new Date().toISOString();
    all[idx] = villa;
    await writeVillas(all);

    return NextResponse.json({ item: galleryItem, villa });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Yükleme hatası';
    console.error('[villa gallery POST]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
