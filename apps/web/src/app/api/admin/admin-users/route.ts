import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { createAdminUser, readAdminUsers } from '@/lib/admin-users-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const users = await readAdminUsers();
  return NextResponse.json({
    users: users
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: { fullName?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const result = await createAdminUser({
    fullName: String(body.fullName ?? ''),
    email: String(body.email ?? ''),
    password: String(body.password ?? ''),
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({
    user: {
      id: result.user!.id,
      fullName: result.user!.fullName,
      email: result.user!.email,
      isActive: result.user!.isActive,
      createdAt: result.user!.createdAt,
      updatedAt: result.user!.updatedAt,
    },
  });
}
