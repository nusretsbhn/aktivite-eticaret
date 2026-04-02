import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { getNextPublicDir } from '@/lib/next-public-dir';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function safePart(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'general';
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.slice(-120) || 'cover.jpg';
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Dosya gerekli.' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Sadece resim yükleyebilirsiniz.' }, { status: 400 });
  }

  const folder = safePart(String(form.get('folder') ?? 'categories'));
  const uploadDir = join(getNextPublicDir(), 'uploads', 'settings', folder);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeFilename(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), bytes);

  const url = `/uploads/settings/${folder}/${filename}`;
  return NextResponse.json({ url });
}
