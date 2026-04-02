import { getDefaultSettings, readSettings } from '@/lib/admin-settings-server';
import { applyOrderMailTemplate, plainTextToHtmlEmail } from '@/lib/mail-ticket-template';
import { sendSmtpMail } from '@/lib/mail-smtp';
import type { Order } from '@/types/order';

export type SendTicketEmailResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'disabled' | 'no_email' | 'no_smtp_credentials' | 'no_from' | 'smtp_send_failed' | 'smtp_failed';
      detail?: string;
    };

/** PDF bilet oluştuktan sonra müşteriye ekli gönderir (ayar + SMTP gerekir). */
export async function sendTicketEmailWithPdf(
  order: Order,
  pdfBuffer: Buffer,
  verifyUrl: string,
  options?: { skipTemplateEnabledCheck?: boolean },
): Promise<SendTicketEmailResult> {
  const settings = await readSettings();
  const mailDefaults = getDefaultSettings().mailManagement!;
  const mm = settings.mailManagement ?? mailDefaults;
  if (!options?.skipTemplateEnabledCheck && !mm.ticketEmailEnabled) {
    return { ok: false, reason: 'disabled' };
  }

  const to = order.email?.trim();
  if (!to) {
    console.warn('[mail] Siparişte e-posta yok; bilet maili gönderilmedi.', order.id);
    return { ok: false, reason: 'no_email' };
  }

  const subjectTpl = mm.ticketEmailSubject?.trim() || mailDefaults.ticketEmailSubject;
  const bodyTpl = mm.ticketEmailBody?.trim() || mailDefaults.ticketEmailBody;

  const subject = applyOrderMailTemplate(subjectTpl, order, { dogrulamaUrl: verifyUrl });
  const body = applyOrderMailTemplate(bodyTpl, order, { dogrulamaUrl: verifyUrl });

  const result = await sendSmtpMail({
    to,
    subject,
    text: body,
    html: plainTextToHtmlEmail(body),
    attachments: [{ filename: `bilet-${order.orderNo}.pdf`, content: pdfBuffer }],
  });

  if (!result.ok) {
    console.warn('[mail] Bilet e-postası gönderilemedi:', result.reason, result.detail ?? '');
    if (result.reason === 'no_from') return { ok: false, reason: 'no_from' };
    if (result.reason === 'no_smtp_credentials') return { ok: false, reason: 'no_smtp_credentials' };
    if (result.reason === 'smtp_send_failed')
      return { ok: false, reason: 'smtp_send_failed', detail: result.detail };
    return { ok: false, reason: 'smtp_failed' };
  }

  return { ok: true };
}
