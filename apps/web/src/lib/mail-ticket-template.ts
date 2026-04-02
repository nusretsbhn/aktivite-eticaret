import type { Order } from '@/types/order';

function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount || 0);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Yer tutucular: {{adSoyad}} {{siparisNo}} {{turAdi}} {{tarih}} {{kalkis}} {{kisi}} {{tutar}}
 * {{dogrulamaUrl}} {{faturaUrl}} {{email}}
 */
export function applyOrderMailTemplate(
  template: string,
  order: Order,
  extras?: { dogrulamaUrl?: string; faturaUrl?: string },
): string {
  const vars: Record<string, string> = {
    adSoyad: order.fullName,
    siparisNo: order.orderNo,
    turAdi: order.tourName,
    tarih: order.date,
    kalkis: order.departurePlace,
    kisi: String(order.peopleCount),
    tutar: formatTry(order.totalAmount),
    dogrulamaUrl: extras?.dogrulamaUrl ?? '',
    faturaUrl: extras?.faturaUrl ?? '',
    email: order.email,
  };
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

/** Bilet e-postası için doğrulama URL’si ile */
export function applyTicketEmailTemplate(template: string, order: Order, verifyUrl: string): string {
  return applyOrderMailTemplate(template, order, { dogrulamaUrl: verifyUrl });
}

export function plainTextToHtmlEmail(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}
