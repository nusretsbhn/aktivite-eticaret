import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import {
  hashPassword,
  readPublicUsers,
  validatePasswordPolicy,
  writePublicUsers,
} from '@/lib/public-users-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const kvkk = (searchParams.get('kvkk') ?? '').trim();
  const sms = (searchParams.get('sms') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize') ?? 25) || 25));

  const all = await readPublicUsers();
  let filtered = all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (q) {
    filtered = filtered.filter((u) => {
      const h = `${u.fullName} ${u.email} ${u.phone}`.toLowerCase();
      return h.includes(q);
    });
  }
  if (kvkk === 'true' || kvkk === 'false') {
    const v = kvkk === 'true';
    filtered = filtered.filter((u) => u.kvkkConsent === v);
  }
  if (sms === 'true' || sms === 'false') {
    const v = sms === 'true';
    filtered = filtered.filter((u) => u.smsConsent === v);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const members = filtered.slice(start, start + pageSize).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    kvkkConsent: u.kvkkConsent,
    smsConsent: u.smsConsent,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return NextResponse.json({
    members,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    kvkkConsent?: boolean;
    smsConsent?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const fullName = String(body.fullName ?? '').trim();
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');
  const kvkkConsent = Boolean(body.kvkkConsent);
  const smsConsent = Boolean(body.smsConsent);

  if (!fullName || !email || !phone || !password) {
    return NextResponse.json({ error: 'Ad soyad, e-posta, telefon ve şifre zorunludur.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Geçerli e-posta girin.' }, { status: 400 });
  }
  const pwdErr = validatePasswordPolicy(password);
  if (pwdErr) {
    return NextResponse.json({ error: pwdErr }, { status: 400 });
  }

  const users = await readPublicUsers();
  if (users.some((u) => u.email === email)) {
    return NextResponse.json({ error: 'Bu e-posta başka kullanıcıda kayıtlı.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(password);
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const next = [
    {
      id,
      fullName,
      email,
      phone,
      passwordHash: hash,
      passwordSalt: salt,
      kvkkConsent,
      smsConsent,
      createdAt: now,
      updatedAt: now,
    },
    ...users,
  ];
  await writePublicUsers(next);

  return NextResponse.json({
    member: {
      id,
      fullName,
      email,
      phone,
      kvkkConsent,
      smsConsent,
      createdAt: now,
      updatedAt: now,
    },
  });
}

