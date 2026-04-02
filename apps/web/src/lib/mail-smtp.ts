import nodemailer from 'nodemailer';

export type SendSmtpResult =
  | { ok: true }
  | { ok: false; reason: 'no_smtp_credentials' | 'no_from' | 'smtp_send_failed'; detail?: string };

function getSmtpEnv() {
  const host = (process.env.SMTP_HOST ?? '').trim() || 'mail.12adalartekneturu.com';
  const portRaw = Number(process.env.SMTP_PORT ?? '465');
  const port = Number.isFinite(portRaw) ? portRaw : 465;
  const user = (process.env.SMTP_USER ?? '').trim();
  const pass = (process.env.SMTP_PASS ?? '').trim();
  const from = (process.env.SMTP_FROM ?? '').trim() || user;
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureEnv === 'false' ? false : port === 465 || secureEnv === 'true';
  return { host, port, secure, user, pass, from };
}

/** Sunucu tarafında SMTP ile gönderim (şifre sadece ortam değişkeninde). */
export async function sendSmtpMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
  replyTo?: string;
}): Promise<SendSmtpResult> {
  const { host, port, secure, user, pass, from } = getSmtpEnv();
  if (!user || !pass) {
    console.warn('[mail] SMTP_USER veya SMTP_PASS tanımlı değil; e-posta gönderilmedi.');
    return { ok: false, reason: 'no_smtp_credentials' };
  }
  if (!from) {
    console.warn('[mail] Gönderen adresi yok (SMTP_FROM / SMTP_USER).');
    return { ok: false, reason: 'no_from' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to: opts.to,
      replyTo: opts.replyTo ?? from,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('[mail] sendMail failed:', detail);
    return { ok: false, reason: 'smtp_send_failed', detail };
  }

  return { ok: true };
}
