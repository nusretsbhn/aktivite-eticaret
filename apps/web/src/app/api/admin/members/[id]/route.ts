import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readPublicUsers, writePublicUsers } from '@/lib/public-users-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  let body: {
    fullName?: string;
    email?: string;
    phone?: string;
    kvkkConsent?: boolean;
    smsConsent?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const users = await readPublicUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i < 0) return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 });

  const current = users[i];
  const nextEmail = body.email !== undefined ? String(body.email).trim().toLowerCase() : current.email;
  if (!nextEmail) return NextResponse.json({ error: 'E-posta zorunlu.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return NextResponse.json({ error: 'Geçerli e-posta girin.' }, { status: 400 });
  }
  if (users.some((u, idx) => idx !== i && u.email === nextEmail)) {
    return NextResponse.json({ error: 'Bu e-posta başka üyede kayıtlı.' }, { status: 409 });
  }

  const merged = {
    ...current,
    fullName: body.fullName !== undefined ? String(body.fullName).trim() : current.fullName,
    email: nextEmail,
    phone: body.phone !== undefined ? String(body.phone).trim() : current.phone,
    kvkkConsent: body.kvkkConsent !== undefined ? Boolean(body.kvkkConsent) : current.kvkkConsent,
    smsConsent: body.smsConsent !== undefined ? Boolean(body.smsConsent) : current.smsConsent,
    updatedAt: new Date().toISOString(),
  };

  if (!merged.fullName || !merged.phone) {
    return NextResponse.json({ error: 'Ad soyad ve telefon zorunlu.' }, { status: 400 });
  }

  users[i] = merged;
  await writePublicUsers(users);

  return NextResponse.json({
    member: {
      id: merged.id,
      fullName: merged.fullName,
      email: merged.email,
      phone: merged.phone,
      kvkkConsent: merged.kvkkConsent,
      smsConsent: merged.smsConsent,
      createdAt: merged.createdAt,
      updatedAt: merged.updatedAt,
    },
  });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const users = await readPublicUsers();
  const next = users.filter((u) => u.id !== id);
  if (next.length === users.length) {
    return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 });
  }
  await writePublicUsers(next);
  return NextResponse.json({ success: true });
}

