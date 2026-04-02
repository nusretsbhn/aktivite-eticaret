import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { VillaDetailView } from '@/components/site/villa-detail-view';
import { readSettings } from '@/lib/admin-settings-server';
import { readVillas } from '@/lib/admin-villas-server';
import { SITE_PRODUCT_VILLA_RENTAL, isSiteProductEnabled } from '@/lib/site-product-types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const villas = await readVillas();
  const villa = villas.find((v) => v.slug === slug && v.isActive);
  if (!villa) return { title: 'Villa' };
  const desc = villa.description?.trim();
  return {
    title: `${villa.displayName} · Villa`,
    ...(desc ? { description: desc.slice(0, 160) } : {}),
  };
}

export default async function VillaDetailPage({ params }: Props) {
  const { slug } = await params;
  const [settings, villas] = await Promise.all([readSettings(), readVillas()]);

  if (!isSiteProductEnabled(settings.siteManagement?.enabledSiteProducts, SITE_PRODUCT_VILLA_RENTAL)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Villa kiralama kapalı</h1>
        <p className="mt-2 text-sm text-zinc-600">Bu bölüm site ayarlarında devre dışı bırakıldı.</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-500">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const villa = villas.find((v) => v.slug === slug && v.isActive);
  if (!villa) {
    notFound();
  }

  return <VillaDetailView villa={villa} settings={settings} />;
}
