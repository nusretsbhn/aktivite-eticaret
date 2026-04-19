import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteFooter } from '@/components/site/site-footer';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { readSettings } from '@/lib/admin-settings-server';

const CONTRACT_ROUTES = {
  'kvkk-politikasi': {
    title: 'Kişisel Verilerin Korunması Politikası',
    key: 'kvkkPolicy',
  },
  'kullanim-kosullari': {
    title: 'Kullanım Koşulları',
    key: 'termsOfUse',
  },
  'cerez-politikasi': {
    title: 'Çerez Politikası',
    key: 'cookiePolicy',
  },
  'cevrimici-ziyaretciler-icin-aydinlatma-metni': {
    title: 'Çevrimiçi Ziyaretçiler İçin Aydınlatma Metni',
    key: 'onlineVisitorsClarification',
  },
  'ticari-elektronik-ileti-onayi': {
    title: 'Ticari Elektronik İleti Onayı',
    key: 'commercialElectronicConsent',
  },
  'on-bilgilendirme-formu': {
    title: 'Ön Bilgilendirme Formu',
    key: 'preInformationForm',
  },
  'mesafeli-satis-sozlesmesi': {
    title: 'Mesafeli Satış Sözleşmesi',
    key: 'distanceSalesContract',
  },
  'islem-rehberi': {
    title: 'İşlem Rehberi',
    key: 'transactionGuide',
  },
  'gizlilik-sozlesmesi': {
    title: 'Gizlilik Sözleşmesi',
    key: 'privacyAgreement',
  },
  'acik-riza-metni': {
    title: 'Açık Rıza Metni',
    key: 'explicitConsentText',
  },
  'teslimat-ve-iade-sartlari': {
    title: 'Teslimat ve İade Şartları',
    key: 'deliveryAndReturnTerms',
  },
} as const;

type Slug = keyof typeof CONTRACT_ROUTES;

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = CONTRACT_ROUTES[slug as Slug];
  if (!route) notFound();

  const settings = await readSettings();
  const content = (settings.contracts?.[route.key] ?? '').trim();
  const logoUrl = settings.siteManagement?.logoUrl;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-700 md:flex">
            <Link href="/aktiviteler" className="font-medium hover:text-zinc-900">
              Turlar
            </Link>
            <Link href="#" className="font-medium hover:text-zinc-900">
              Kampanyalar
            </Link>
            <Link href="/blog" className="font-medium hover:text-zinc-900">
              Blog
            </Link>
            <Link href="/iletisim" className="font-medium hover:text-zinc-900">
              İletişim
            </Link>
          </nav>
          <SiteAccountWithNotifications menuClassName="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50" />
        </div>
      </header>

      <main className="min-h-[70vh]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <div className="mb-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
              Ana sayfaya dön
            </Link>
          </div>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8">
            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">{route.title}</h1>
            <div className="mt-6 border-t border-zinc-200 pt-6">
              {content ? (
                <div className="prose prose-zinc max-w-none whitespace-pre-wrap text-zinc-700">
                  {content}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Bu sözleşme metni henüz eklenmedi.</p>
              )}
            </div>
          </article>
        </div>
      </main>

      <SiteFooter
        socialMedia={settings.socialMedia}
        footerManagement={settings.footerManagement}
        enabledSiteProducts={settings.siteManagement?.enabledSiteProducts}
      />
    </div>
  );
}

