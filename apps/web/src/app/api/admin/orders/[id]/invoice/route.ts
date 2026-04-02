import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { sendInvoiceEmailWithPdf } from '@/lib/order-invoice-email';
import { getRequestOrigin } from '@/lib/request-origin';
import { getUploadsDir } from '@/lib/next-public-dir';
import { readOrders, writeOrders } from '@/lib/orders-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.slice(-120) || 'invoice.pdf';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await params;

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'PDF dosyası gerekli.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Sadece PDF yüklenebilir.' }, { status: 400 });
  }

  const uploadDir = join(getUploadsDir(), 'uploads', 'orders', 'invoices');
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeFilename(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), bytes);
  const url = `/uploads/orders/invoices/${filename}`;

  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
  const updatedOrder = { ...orders[idx], invoicePdfUrl: url, updatedAt: new Date().toISOString() };
  orders[idx] = updatedOrder;
  await writeOrders(orders);

  const safeAttach = safeFilename(file.name);
  try {
    await sendInvoiceEmailWithPdf(updatedOrder, bytes, getRequestOrigin(request), safeAttach);
  } catch (e) {
    console.error('[invoice upload] fatura e-postası', e);
  }

  return NextResponse.json({ url, order: updatedOrder });
}

