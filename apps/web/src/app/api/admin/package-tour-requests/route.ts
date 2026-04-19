import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readPackageTourRequests } from '@/lib/package-tour-requests-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const requests = (await readPackageTourRequests()).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ requests });
}

