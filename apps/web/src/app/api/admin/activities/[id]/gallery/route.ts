import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readActivities, writeActivities } from '@/lib/admin-activities-server';
import { formDataBlobName, getFormDataBlob } from '@/lib/form-data-file';
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

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readActivities();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return notFound();

  const form = await request.formData();
  const blob = getFormDataBlob(form.get('file'));
  if (!blob || blob.size === 0) {
    return NextResponse.json({ error: 'Dosya gerekli.' }, { status: 400 });
  }

  const mime = blob.type || '';
  const isVideo = mime.startsWith('video/');
  const isImage = mime.startsWith('image/');
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: 'Sadece resim veya video yükleyin.' }, { status: 400 });
  }

  const buf = Buffer.from(await blob.arrayBuffer());
  const activity = all[idx];
  if (!activity) return notFound();

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'activities', activity.id);
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${safeFilename(formDataBlobName(blob))}`;
  await writeFile(join(uploadDir, filename), buf);

  const publicUrl = `/uploads/activities/${activity.id}/${filename}`;
  const galleryItem: GalleryItem = {
    id: randomUUID(),
    url: publicUrl,
    type: isVideo ? 'video' : 'image',
    sortOrder: activity.gallery.length,
    isCover: activity.gallery.length === 0,
  };

  activity.gallery = [...activity.gallery, galleryItem];
  activity.updatedAt = new Date().toISOString();
  all[idx] = activity;
  await writeActivities(all);

  return NextResponse.json({ item: galleryItem, activity });
}
