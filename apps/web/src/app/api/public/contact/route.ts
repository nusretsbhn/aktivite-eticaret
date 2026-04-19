import { NextResponse } from 'next/server';

import { appendContactMessage } from '@/lib/contact-messages-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const fullName = String(body.fullName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!fullName) {
    return NextResponse.json({ success: false, message: 'Ad Soyad zorunludur.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ success: false, message: 'Geçerli telefon giriniz.' }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ success: false, message: 'Konu zorunludur.' }, { status: 400 });
  }
  if (!message || message.length < 5) {
    return NextResponse.json({ success: false, message: 'Mesaj en az 5 karakter olmalıdır.' }, { status: 400 });
  }

  await appendContactMessage({
    fullName: fullName.slice(0, 120),
    phone: phone.slice(0, 40),
    subject: subject.slice(0, 160),
    message: message.slice(0, 5000),
  });

  return NextResponse.json({ success: true });
}
