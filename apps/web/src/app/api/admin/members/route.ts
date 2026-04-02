import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readPublicUsers } from '@/lib/public-users-server';

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

