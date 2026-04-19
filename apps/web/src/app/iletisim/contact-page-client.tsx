'use client';

import Link from 'next/link';
import { useState } from 'react';

import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { SiteFooter } from '@/components/site/site-footer';
import { SITE_PRODUCT_VILLA_RENTAL } from '@/lib/site-product-types';
import type { AdminSettings } from '@/types/admin-settings';

type Props = {
  settings: AdminSettings;
};

export function ContactPageClient({ settings }: Props) {
  const logoUrl = settings.siteManagement?.logoUrl;
  const contact = settings.contactManagement;
  const enabledProducts = settings.siteManagement?.enabledSiteProducts ?? [];
  const showVillaNavLink = enabledProducts.includes(SITE_PRODUCT_VILLA_RENTAL);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setFormMessage(null);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, subject, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setFormMessage(data.message ?? 'Mesaj gönderilemedi.');
        return;
      }
      setFormMessage('Mesajınız alındı. En kısa sürede dönüş yapacağız.');
      setFullName('');
      setPhone('');
      setSubject('');
      setMessage('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-700 md:flex">
            <Link href="/aktiviteler" className="font-medium hover:text-zinc-900">
              Turlar
            </Link>
            {showVillaNavLink ? (
              <Link href="/villalar" className="font-medium hover:text-zinc-900">
                Villalar
              </Link>
            ) : null}
            <Link href="/blog" className="font-medium hover:text-zinc-900">
              Blog
            </Link>
            <Link href="/iletisim" className="font-semibold text-zinc-900">
              İletişim
            </Link>
          </nav>
          <SiteAccountWithNotifications menuClassName="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50" />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h1 className="text-2xl font-bold text-zinc-900">İletişim</h1>
          <p className="mt-2 text-sm text-zinc-600">Sorularınız için bizimle iletişime geçebilirsiniz.</p>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-zinc-800">Adres</p>
              <p className="mt-1 whitespace-pre-line text-zinc-700">{contact?.address || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-800">Telefon</p>
              <div className="mt-1 space-y-1">
                <p className="text-zinc-700">{contact?.phonePrimary || '-'}</p>
                {contact?.phoneSecondary ? <p className="text-zinc-700">{contact.phoneSecondary}</p> : null}
              </div>
            </div>
            <div>
              <p className="font-semibold text-zinc-800">E-posta</p>
              <p className="mt-1 text-zinc-700">{contact?.email || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-800">Google Maps</p>
              {contact?.googleMapsUrl ? (
                <a
                  href={contact.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-blue-700 hover:underline"
                >
                  Haritada aç
                </a>
              ) : (
                <p className="mt-1 text-zinc-700">-</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">İletişim Formu</h2>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <input
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Ad Soyad"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Konu"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Mesaj"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {formMessage ? <p className="text-sm text-zinc-700">{formMessage}</p> : null}
            <button
              type="submit"
              disabled={sending}
              className="min-h-11 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {sending ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </form>
        </section>
      </main>

      <SiteFooter
        socialMedia={settings.socialMedia}
        footerManagement={settings.footerManagement}
        enabledSiteProducts={settings.siteManagement?.enabledSiteProducts}
      />
    </div>
  );
}
