import nodemailer from 'nodemailer';
import { readSettings } from '@/lib/admin-settings-server';

export type SendSmtpResult =
  | { ok: true }
  | { ok: false; reason: 'no_smtp_credentials' | 'no_from' | 'smtp_send_failed'; detail?: string };

async function getSmtpEnv() {
  const defaultHost = (process.env.SMTP_HOST ?? '').trim() || 'mail.12adalartekneturu.com';
  const envPortRaw = Number(process.env.SMTP_PORT ?? '465');
  const defaultPort = Number.isFinite(envPortRaw) ? envPortRaw : 465;
  const envUser = (process.env.SMTP_USER ?? '').trim();
  const envPass = (process.env.SMTP_PASS ?? '').trim();
  const envFrom = (process.env.SMTP_FROM ?? '').trim() || envUser;
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const defaultSecure = secureEnv === 'false' ? false : defaultPort === 465 || secureEnv === 'true';

  try {
    const settings = await readSettings();
    const em = settings.emailManagement;
    const host = (em?.smtpHost ?? '').trim() || defaultHost;
    const port = Number.isFinite(Number(em?.smtpPort)) ? Number(em?.smtpPort) : defaultPort;
    const user = (em?.smtpUser ?? '').trim() || envUser;
    const pass = (em?.smtpPass ?? '').trim() || envPass;
    const from = (em?.smtpFrom ?? '').trim() || envFrom || user;
    const secure = typeof em?.smtpSecure === 'boolean' ? em.smtpSecure : defaultSecure;
    return { host, port, secure, user, pass, from };
  } catch {
    return {
      host: defaultHost,
      port: defaultPort,
      secure: defaultSecure,
      user: envUser,
      pass: envPass,
      from: envFrom,
    };
  }
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
  const { host, port, secure, user, pass, from } = await getSmtpEnv();
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
