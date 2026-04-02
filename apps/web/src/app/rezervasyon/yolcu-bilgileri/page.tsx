import Link from 'next/link';
import { PhoneCall } from 'lucide-react';

import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { readActivities } from '@/lib/admin-activities-server';
import { validateBookingRequest } from '@/lib/availability-helpers';
import { readSettings } from '@/lib/admin-settings-server';
import { PassengerFormClient } from './passenger-form-client';

function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount || 0);
}

function getCoverImageUrl(activity: Awaited<ReturnType<typeof readActivities>>[number]): string {
  const images = (activity.gallery ?? [])
    .filter((g) => g.type === 'image' && g.url)
    .slice()
    .sort((x, y) => (x.isCover === y.isCover ? x.sortOrder - y.sortOrder : x.isCover ? -1 : 1));
  return images[0]?.url ?? '';
}

function formatDate(iso?: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return new Intl.DateTimeFormat('tr-TR').format(date);
}

export default async function PassengerInfoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [settings, activities] = await Promise.all([readSettings(), readActivities()]);
  const sp = (await searchParams) ?? {};
  const activityId = typeof sp.activityId === 'string' ? sp.activityId : '';
  const date = typeof sp.date === 'string' ? sp.date : '';
  const people = Math.max(1, Number(typeof sp.people === 'string' ? sp.people : '1'));
  const paymentPlan =
    typeof sp.paymentPlan === 'string' && (sp.paymentPlan === 'full' || sp.paymentPlan === 'prepayment')
      ? sp.paymentPlan
      : 'prepayment';

  const activity =
    activities.find((a) => a.id === activityId && a.isActive) ??
    activities.find((a) => a.isActive) ??
    null;

  const activityExact = activityId ? activities.find((a) => a.id === activityId) : null;
  const bookingValidation: ReturnType<typeof validateBookingRequest> = (() => {
    if (activityId && !activityExact) {
      return { ok: false, httpStatus: 400, message: 'Tur bulunamadı.' };
    }
    if (activityExact && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return validateBookingRequest(activityExact, date, people);
    }
    return { ok: true };
  })();

  const logoUrl = settings.siteManagement?.logoUrl;
  const cover = activity ? getCoverImageUrl(activity) : '';
  const selectedPrice =
    activity && date ? (activity.prices ?? []).find((p) => p.date === date)?.price : undefined;
  const price = typeof selectedPrice === 'number' ? selectedPrice : 0;
  const totalAmount = price * people;
  const prepaymentPercent =
    typeof activity?.prepaymentPercent === 'number'
      ? Math.min(100, Math.max(1, Math.round(activity.prepaymentPercent)))
      : 100;
  const prepaymentAmount = Math.round((totalAmount * prepaymentPercent) / 100);
  const payableAmount = paymentPlan === 'full' ? totalAmount : prepaymentAmount;
  const remainingAmount = Math.max(0, totalAmount - payableAmount);
  const nextUrl = `/rezervasyon/odeme?activityId=${encodeURIComponent(activity?.id ?? '')}&date=${encodeURIComponent(
    date,
  )}&people=${encodeURIComponent(String(people))}&paymentPlan=${encodeURIComponent(paymentPlan)}`;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <div className="hidden items-center gap-5 text-sm text-zinc-700 md:flex">
            <span className="font-semibold text-blue-600">1 Tur seçimi</span>
            <span className="font-semibold text-blue-600">2 Yolcu Bilgileri</span>
            <span>3 Ödeme bilgileri</span>
          </div>
          <SiteAccountWithNotifications menuClassName="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800" />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <PassengerFormClient
          nextUrl={nextUrl}
          peopleCount={people}
          isFamilyBoat={activity?.boatType === 'family'}
          bookingBlocked={!bookingValidation.ok}
          bookingMessage={bookingValidation.ok ? undefined : bookingValidation.message}
        />

        <aside className="space-y-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={activity?.name ?? 'Tur görseli'} className="aspect-[16/10] w-full rounded-lg object-cover" />
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-500">
                Görsel yok
              </div>
            )}
            <div className="mt-3 space-y-1">
              <p className="text-base font-extrabold text-zinc-900">{activity?.name ?? 'Tur bulunamadı'}</p>
              <p className="text-sm text-zinc-600">{activity?.departurePlace || '-'}</p>
              <p className="text-sm text-zinc-600">Tarih: {formatDate(date)}</p>
              <p className="text-xs text-zinc-500">
                Tur kuralları: Tur saatinden en az 15 dakika önce hazır bulunmanız gerekmektedir.
              </p>
              <button
                type="button"
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                Tur Detayı
              </button>
            </div>
            <div className="mt-3 border-t border-zinc-200 pt-3">
              <p className="text-sm text-zinc-600">Kişi başı</p>
              <p className="text-3xl font-extrabold text-zinc-900">
                {formatTry(price)} <span className="text-lg">TRY</span>
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {paymentPlan === 'full' ? 'Toplam ödeme' : `Ön ödeme (%${prepaymentPercent})`}
              </p>
              <p className="text-xl font-extrabold text-zinc-900">{formatTry(payableAmount)} TRY</p>
              <p className="text-sm text-zinc-600">Kalan ödeme {formatTry(remainingAmount)} TRY</p>
              <p className="text-sm text-zinc-600">Toplam {formatTry(totalAmount)} TRY</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <p className="text-xs text-zinc-500">Desteğe mi ihtiyacınız var?</p>
            <a href="tel:+905536882734" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <PhoneCall className="h-4 w-4" /> 0553 688 27 34
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}

