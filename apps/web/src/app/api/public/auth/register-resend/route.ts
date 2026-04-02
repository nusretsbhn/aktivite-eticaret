import { NextResponse } from 'next/server';

import { sendRegisterOtpEmail } from '@/lib/otp-register-email';
import {
  generateSixDigitCode,
  hashOtpCode,
  pruneExpiredPending,
  upsertPending,
  findPendingByEmail,
} from '@/lib/register-pending-server';

const OTP_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  await pruneExpiredPending();

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ success: false, message: 'E-posta zorunlu.' }, { status: 400 });
  }

  const pending = await findPendingByEmail(email);
  if (!pending) {
    return NextResponse.json(
      { success: false, message: 'Aktif doğrulama bulunamadı. Kayıt formunu yeniden gönderin.' },
      { status: 400 },
    );
  }

  const code = generateSixDigitCode();
  const codeHash = hashOtpCode(pending.id, email, code);
  const now = Date.now();
  const expiresAt = new Date(now + OTP_TTL_MS).toISOString();

  await upsertPending({
    ...pending,
    codeHash,
    expiresAt,
  });

  const sent = await sendRegisterOtpEmail(email, code);
  if (!sent) {
    return NextResponse.json(
      { success: false, message: 'E-posta gönderilemedi. SMTP ayarlarını kontrol edin.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ success: true, expiresAt, ttlSeconds: Math.floor(OTP_TTL_MS / 1000) });
}
