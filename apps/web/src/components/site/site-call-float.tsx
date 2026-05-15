'use client';

import { Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { buildTelUrl, normalizeWhatsAppDigits } from '@/lib/whatsapp-digits';

type Props = {
  /** tel: için ulusal rakamlar (örn. 905536882734) */
  phoneDigits?: string;
};

export function SiteCallFloat({ phoneDigits }: Props) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  const raw = (phoneDigits ?? '').replace(/\D/g, '');
  const normalized = raw ? normalizeWhatsAppDigits(raw) : null;
  if (!normalized) return null;

  const href = buildTelUrl(normalized);

  return (
    <a
      href={href}
      className="fixed bottom-5 left-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-black/20 transition hover:bg-blue-500 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label="Telefon ile ara"
      title="Ara"
    >
      <Phone className="h-7 w-7" strokeWidth={2.25} aria-hidden />
    </a>
  );
}
