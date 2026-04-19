'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Chrome, Facebook, Instagram, Youtube } from 'lucide-react';

import type { AdminSettings } from '@/types/admin-settings';

type FooterGroup = {
  title: string;
  links: { label: string; href: string }[];
};

const GROUPS: FooterGroup[] = [
  {
    title: 'Gizlilik ve Güvenlik',
    links: [
      { label: 'Kişisel Verilerin Korunması Politikası', href: '/sozlesmeler/kvkk-politikasi' },
      { label: 'Kullanım Koşulları', href: '/sozlesmeler/kullanim-kosullari' },
      { label: 'Çerez Politikası', href: '/sozlesmeler/cerez-politikasi' },
      { label: 'Mesafeli Satış Sözleşmesi', href: '/sozlesmeler/mesafeli-satis-sozlesmesi' },
      { label: 'Teslimat ve İade Şartları', href: '/sozlesmeler/teslimat-ve-iade-sartlari' },
    ],
  },
  {
    title: 'Sözleşmeler',
    links: [
      {
        label: 'Çevrimiçi Ziyaretçiler İçin Aydınlatma Metni',
        href: '/sozlesmeler/cevrimici-ziyaretciler-icin-aydinlatma-metni',
      },
      { label: 'Ticari Elektronik İleti Onayı', href: '/sozlesmeler/ticari-elektronik-ileti-onayi' },
      { label: 'Ön Bilgilendirme Formu', href: '/sozlesmeler/on-bilgilendirme-formu' },
      { label: 'İşlem Rehberi', href: '/sozlesmeler/islem-rehberi' },
      { label: 'Gizlilik Sözleşmesi', href: '/sozlesmeler/gizlilik-sozlesmesi' },
      { label: 'Açık Rıza Metni', href: '/sozlesmeler/acik-riza-metni' },
    ],
  },
  {
    title: 'Bölgeler',
    links: [
      { label: 'Ovacık Bölgesi Villaları', href: `/villalar?region=${encodeURIComponent('Ovacık')}` },
      { label: 'Faralya Bölgesi Villaları', href: `/villalar?region=${encodeURIComponent('Faralya')}` },
      { label: 'Yalıkavak Bölgesi Villaları', href: `/villalar?region=${encodeURIComponent('Yalıkavak')}` },
      { label: 'Göcek Bölgesi Villaları', href: `/villalar?region=${encodeURIComponent('Göcek')}` },
      { label: 'Ölüdeniz Bölgesi Villaları', href: `/villalar?region=${encodeURIComponent('Ölüdeniz')}` },
    ],
  },
];

const SOCIAL_ORDER: {
  key: keyof NonNullable<AdminSettings['socialMedia']>;
  label: string;
  Icon: typeof Instagram;
}[] = [
  { key: 'instagramUrl', label: 'Instagram', Icon: Instagram },
  { key: 'facebookUrl', label: 'Facebook', Icon: Facebook },
  { key: 'googleUrl', label: 'Google', Icon: Chrome },
  { key: 'youtubeUrl', label: 'Youtube', Icon: Youtube },
];

const DEFAULT_BRAND = '12.adalartekneturu.com';

/** TÜRSAB dijital doğrulama — band görseli footer’dan yönetilir; hedef adres sabittir. */
const TURSAB_DDS_HREF = 'https://www.tursab.org.tr/tr/ddsv';

/** Google Play / App Store footer butonları — linkler hazır olunca `true` yapın. */
const SHOW_FOOTER_STORE_BADGES = false;

export function SiteFooter({
  socialMedia,
  footerManagement,
}: {
  socialMedia?: AdminSettings['socialMedia'];
  footerManagement?: AdminSettings['footerManagement'];
}) {
  const [showTop, setShowTop] = useState(false);

  const brandText = (footerManagement?.footerBrandText ?? '').trim() || DEFAULT_BRAND;

  const socialLinks = useMemo(() => {
    const sm = socialMedia ?? {};
    return SOCIAL_ORDER.map(({ key, label, Icon }) => {
      const href = (sm[key] ?? '').trim();
      if (!href) return null;
      return { key, label, href, Icon };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [socialMedia]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <footer className="bg-white">
      <div className="border-t border-zinc-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_1fr_1fr_0.9fr]">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="text-sm font-semibold text-zinc-900">{g.title}</p>
              <ul className="mt-4 space-y-2">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-zinc-600 hover:text-zinc-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-5">
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {socialLinks.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}

            {SHOW_FOOTER_STORE_BADGES && (
              <div className="space-y-3">
                <a
                  href="#"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Google Play
                </a>
                <a
                  href="#"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  App Store
                </a>
              </div>
            )}

            {footerManagement?.tursabVerificationImageUrl ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <a
                  href={TURSAB_DDS_HREF}
                  target="_blank"
                  rel="noopener"
                  className="inline-block max-w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={footerManagement.tursabVerificationImageUrl}
                    alt="TÜRSAB dijital doğrulama"
                    className="h-auto max-h-24 w-auto max-w-full object-contain object-left"
                  />
                </a>
              </div>
            ) : null}

            {footerManagement?.paymentMethodsImageUrl ? (
              <div className="flex justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={footerManagement.paymentMethodsImageUrl}
                  alt="Ödeme yöntemleri"
                  className="max-h-12 w-auto max-w-full object-contain object-left"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-zinc-200">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-zinc-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Tüm hakları saklıdır.</p>
            <p className="font-medium text-zinc-600">{brandText}</p>
          </div>
        </div>
      </div>

      {showTop && (
        <button
          type="button"
          aria-label="Yukarı çık"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-500"
        >
          ↑
        </button>
      )}
    </footer>
  );
}
