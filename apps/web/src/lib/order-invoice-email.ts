import { getDefaultSettings, readSettings } from '@/lib/admin-settings-server';
import { applyOrderMailTemplate, plainTextToHtmlEmail } from '@/lib/mail-ticket-template';
import { sendSmtpMail } from '@/lib/mail-smtp';
import type { Order } from '@/types/order';

/** Admin fatura PDF yüklediğinde müşteriye ekli gönderir. */
export async function sendInvoiceEmailWithPdf(
  order: Order,
  pdfBuffer: Buffer,
  requestOrigin: string,
  attachmentFilename: string,
): Promise<
  | { ok: true }
  | {
      ok: false;
      reason: 'disabled' | 'no_email' | 'no_smtp_credentials' | 'no_from' | 'smtp_send_failed' | 'smtp_failed';
      detail?: string;
    }
> {
  const settings = await readSettings();
  const mailDefaults = getDefaultSettings().mailManagement!;
  const mm = settings.mailManagement ?? mailDefaults;
  if (!mm.invoiceEmailEnabled) {
    return { ok: false, reason: 'disabled' };
  }

  const to = order.email?.trim();
  if (!to) {
    console.warn('[mail] Siparişte e-posta yok; fatura maili gönderilmedi.', order.id);
    return { ok: false, reason: 'no_email' };
  }

  const base = requestOrigin.replace(/\/$/, '');
  const verifyUrl = `${base}/bilet/${order.id}`;
  const faturaUrl = order.invoicePdfUrl ? `${base}${order.invoicePdfUrl}` : '';

  const subjectTpl = mm.invoiceEmailSubject?.trim() || mailDefaults.invoiceEmailSubject;
  const bodyTpl = mm.invoiceEmailBody?.trim() || mailDefaults.invoiceEmailBody;

  const subject = applyOrderMailTemplate(subjectTpl, order, { dogrulamaUrl: verifyUrl, faturaUrl });
  const body = applyOrderMailTemplate(bodyTpl, order, { dogrulamaUrl: verifyUrl, faturaUrl });

  const result = await sendSmtpMail({
    to,
    subject,
    text: body,
    html: plainTextToHtmlEmail(body),
    attachments: [{ filename: attachmentFilename, content: pdfBuffer }],
  });

  if (!result.ok) {
    console.warn('[mail] Fatura e-postası gönderilemedi:', result.reason, result.detail ?? '');
    if (result.reason === 'no_from') return { ok: false, reason: 'no_from' };
    if (result.reason === 'no_smtp_credentials') return { ok: false, reason: 'no_smtp_credentials' };
    if (result.reason === 'smtp_send_failed')
      return { ok: false, reason: 'smtp_send_failed', detail: result.detail };
    return { ok: false, reason: 'smtp_failed' };
  }

  return { ok: true };
}
