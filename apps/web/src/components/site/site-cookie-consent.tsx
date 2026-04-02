'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { dispatchCookieConsentAccepted, hasCookieConsentCookie, setCookieConsentCookie } from '@/lib/cookie-consent';

export function SiteCookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    if (hasCookieConsentCookie()) return;
    setVisible(true);
  }, [pathname]);

  const accept = useCallback(() => {
    setCookieConsentCookie();
    dispatchCookieConsentAccepted();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 left-5 z-[85] w-[min(100vw-2.5rem,22rem)] rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl shadow-zinc-900/10 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <h2 id="cookie-consent-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Çerez kullanımı
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        Deneyiminizi iyileştirmek için çerezler kullanıyoruz. &quot;Kabul et&quot; ile tercihinizi kaydeder ve{' '}
        <Link
          href="/sozlesmeler/cerez-politikasi"
          className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          çerez politikamızı
        </Link>{' '}
        onaylamış olursunuz.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Kabul et
        </button>
      </div>
    </div>
  );
}
