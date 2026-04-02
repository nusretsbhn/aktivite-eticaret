import { sendSmtpMail } from '@/lib/mail-smtp';

export async function sendRegisterOtpEmail(to: string, code: string, siteName = 'Bodrum Aktivite'): Promise<boolean> {
  const subject = `${siteName} — E-posta doğrulama kodunuz`;
  const text = `Merhaba,\n\n${siteName} kayıt işleminizi tamamlamak için doğrulama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#18181b;background:#fafafa;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
    <tr><td>
      <p style="margin:0 0 8px;font-size:14px;color:#71717a;">${escapeHtml(siteName)}</p>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;">E-posta doğrulama</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;">Kayıt işleminizi tamamlamak için aşağıdaki 6 haneli kodu girin:</p>
      <p style="margin:0 0 24px;font-size:32px;font-weight:800;letter-spacing:0.25em;color:#0d9488;text-align:center;">${escapeHtml(code)}</p>
      <p style="margin:0;font-size:13px;color:#71717a;">Bu kod 15 dakika geçerlidir. İsteği siz yapmadıysanız bu e-postayı yok sayın.</p>
    </td></tr>
  </table>
</body>
</html>`;
  const r = await sendSmtpMail({ to, subject, text, html });
  return r.ok;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
