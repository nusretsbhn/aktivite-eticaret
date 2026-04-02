import Link from 'next/link';

import { VillaOnRezervasyonForm } from '@/components/site/villa-on-rezervasyon-form';
import { readSettings } from '@/lib/admin-settings-server';
import { readVillas } from '@/lib/admin-villas-server';

function sp(p: Record<string, string | string[] | undefined>, key: string): string {
  const v = p[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return '';
}

export default async function VillaOnRezervasyonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const tesekkur = p.tesekkur === '1';

  if (tesekkur) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-800">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">Teşekkürler</h1>
          <p className="mt-3 text-zinc-600">
            Ön rezervasyon talebiniz alınmıştır; en kısa sürede size dönüş yapılacaktır.
          </p>
          <Link
            href="/villalar"
            className="mt-8 inline-flex rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Villalara dön
          </Link>
        </div>
      </div>
    );
  }

  const villaSlug = sp(p, 'villa');
  const checkIn = sp(p, 'checkIn');
  const checkOut = sp(p, 'checkOut');
  const guestsRaw = sp(p, 'guests');
  const guests = Math.max(1, Number(guestsRaw) || 1);

  if (!villaSlug || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Geçersiz bağlantı</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Ön rezervasyon için villa detayından tarih seçip yönlendirme yapın.
          </p>
          <Link href="/villalar" className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:underline">
            Villalara dön
          </Link>
        </div>
      </div>
    );
  }

  const [villas, settings] = await Promise.all([readVillas(), readSettings()]);
  const villa = villas.find((v) => v.slug === villaSlug && v.isActive);
  if (!villa) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Villa bulunamadı</h1>
          <Link href="/villalar" className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:underline">
            Villalara dön
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = settings.siteManagement?.logoUrl;

  return (
    <VillaOnRezervasyonForm
      villa={villa}
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      initialGuests={guests}
      logoUrl={logoUrl}
    />
  );
}
