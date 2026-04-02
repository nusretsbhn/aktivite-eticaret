import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { sendTicketEmailWithPdf } from '@/lib/order-ticket-email';
import { buildOrderTicketPdfBuffer } from '@/lib/order-ticket-pdf';
import { isOrderTicketEligible } from '@/lib/order-ticket-eligibility';
import { readOrders, writeOrders } from '@/lib/orders-server';

/** Havale ödendi veya kart ile ödeme sonrası PDF üretir ve `ticketIssuedAt` yazar. */
export async function issueOrderTicketIfNeeded(orderId: string, verifyBaseUrl: string): Promise<void> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return;
  const order = orders[idx];
  if (!isOrderTicketEligible(order)) return;
  if (order.ticketIssuedAt) return;

  const base = verifyBaseUrl.replace(/\/$/, '');
  const verifyUrl = `${base}/bilet/${order.id}`;
  const buf = await buildOrderTicketPdfBuffer(order, verifyUrl);
  const dir = join(process.cwd(), 'data', 'tickets');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${orderId}.pdf`), buf);
  const now = new Date().toISOString();
  const updated = { ...order, ticketIssuedAt: now, updatedAt: now };
  orders[idx] = updated;
  await writeOrders(orders);

  try {
    await sendTicketEmailWithPdf(updated, buf, verifyUrl);
  } catch (e) {
    console.error('[order-ticket-issue] ticket email', e);
  }
}
