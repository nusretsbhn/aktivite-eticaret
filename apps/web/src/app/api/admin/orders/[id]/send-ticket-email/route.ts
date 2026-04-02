import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { getOrderTicketPdfBuffer } from '@/lib/order-ticket-pdf';
import { sendTicketEmailWithPdf } from '@/lib/order-ticket-email';
import { getRequestOrigin } from '@/lib/request-origin';
import { readOrders } from '@/lib/orders-server';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const orders = await readOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  let buf: Buffer | null;
  try {
    buf = await getOrderTicketPdfBuffer(order, getRequestOrigin(request));
  } catch (e) {
    console.error('[admin/send-ticket-email]', e);
    return NextResponse.json({ error: 'PDF oluşturulamadı.' }, { status: 500 });
  }
  if (!buf) {
    return NextResponse.json(
      { error: 'Bu sipariş için bilet henüz oluşturulmadı veya uygun değil.' },
      { status: 400 },
    );
  }

  const base = getRequestOrigin(request).replace(/\/$/, '');
  const verifyUrl = `${base}/bilet/${order.id}`;

  const sent = await sendTicketEmailWithPdf(order, buf, verifyUrl, { skipTemplateEnabledCheck: true });
  if (sent.ok) {
    return NextResponse.json({ ok: true });
  }

  const msg = (() => {
    if (sent.reason === 'no_email') return 'Siparişte e-posta adresi yok.';
    if (sent.reason === 'no_from') return 'Gönderen adresi tanımlı değil (SMTP_FROM veya SMTP_USER).';
    if (sent.reason === 'no_smtp_credentials') {
      return 'SMTP kullanıcı adı veya şifre yok. apps/web/.env.local içinde SMTP_USER ve SMTP_PASS tanımlayın; dosyayı kaydettikten sonra geliştirme sunucusunu yeniden başlatın (npm run dev).';
    }
    if (sent.reason === 'smtp_send_failed') {
      const d = sent.detail ? ` (${sent.detail})` : '';
      return `SMTP sunucusu reddetti veya bağlanılamadı.${d} Host/port/şifre ve güvenlik duvarını kontrol edin.`;
    }
    if (sent.reason === 'smtp_failed') {
      return 'SMTP ile gönderilemedi. Ortam değişkenlerini (SMTP_*) kontrol edin.';
    }
    return 'Mail gönderimi kapatılmış olabilir; ayarlardan kontrol edin.';
  })();

  return NextResponse.json({ error: msg }, { status: 400 });
}
