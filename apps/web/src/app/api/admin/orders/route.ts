import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readOrders } from '@/lib/orders-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const paymentType = (searchParams.get('paymentType') ?? '').trim();
  const status = (searchParams.get('status') ?? '').trim();
  const kind = (searchParams.get('kind') ?? 'order').trim();
  const sort = (searchParams.get('sort') ?? 'newest').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize') ?? 25) || 25));

  let filtered = (await readOrders()).slice();
  filtered = filtered.filter((o) => {
    const k = o.orderKind === 'ask_sell' ? 'ask_sell' : 'order';
    return kind === 'ask_sell' ? k === 'ask_sell' : k === 'order';
  });
  if (q) {
    filtered = filtered.filter((o) =>
      `${o.orderNo} ${o.fullName} ${o.phone} ${o.tourName}`.toLowerCase().includes(q),
    );
  }
  if (paymentType === 'transfer' || paymentType === 'credit_card' || paymentType === 'ask_sell') {
    filtered = filtered.filter((o) => o.paymentType === paymentType);
  }
  if (status === 'new' || status === 'completed' || status === 'cancelled') {
    filtered = filtered.filter((o) => o.status === status);
  }
  filtered.sort((a, b) =>
    sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const orders = filtered.slice(start, start + pageSize);

  return NextResponse.json({ orders, total, page: currentPage, pageSize, totalPages });
}

