'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Minus, Plus } from 'lucide-react';

import { VillaBookingDateRangeModal } from '@/components/site/villa-booking-date-range-modal';
import { useSiteAuth } from '@/components/site/site-auth-provider';
import { nightsBetween, nightDates, sumNightlyPrices } from '@/lib/villa-booking-math';
import { formatVillaPrice } from '@/lib/villa-public-pricing';
import { isValidVillaStayRange } from '@/lib/villa-stay-availability';
import type { AdminVilla } from '@/types/admin-villa';

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => number;
      reset: (id?: number) => void;
      ready: (cb: () => void) => void;
    };
  }
}

const inputClassName =
  'mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-500 shadow-none outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const selectClassName =
  'h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-none outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

function formatTrRange(checkIn: string, checkOut: string): string {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${a.toLocaleDateString('tr-TR', o)} – ${b.toLocaleDateString('tr-TR', o)}`;
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-zinc-900">{value}</span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
          aria-label="Artır"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type Props = {
  villa: AdminVilla;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  initialChildren?: number;
  initialBabies?: number;
  logoUrl?: string | null;
};

function parseProfilePhone(raw: string): { cc: string; national: string } | null {
  const t = raw.trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('90')) {
    return { cc: '+90', national: digits.slice(-10) };
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    return { cc: '+90', national: digits };
  }
  if (digits.length >= 10) {
    return { cc: '+90', national: digits.slice(-10) };
  }
  return null;
}

export function VillaOnRezervasyonForm({
  villa,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialChildren = 0,
  initialBabies = 0,
  logoUrl,
}: Props) {
  const router = useRouter();
  const { user } = useSiteAuth();

  const [email, setEmail] = useState('');

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const maxCap = Math.max(1, villa.guestCount);
  const startAdults = Math.min(Math.max(1, initialGuests), maxCap);
  const [adults, setAdults] = useState(startAdults);
  const [children, setChildren] = useState(Math.max(0, initialChildren));
  const [babies, setBabies] = useState(Math.max(0, initialBabies));

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+90');
  const [phone, setPhone] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [foreignPhone, setForeignPhone] = useState(false);
  const [notTurkishCitizen, setNotTurkishCitizen] = useState(false);

  const [accommodationType, setAccommodationType] = useState<'family' | 'friends'>('family');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentPreference, setPaymentPreference] = useState<'full' | 'prepayment'>('prepayment');
  const [referralSource, setReferralSource] = useState('');

  const [legalIdentity, setLegalIdentity] = useState(false);
  const [distanceSales, setDistanceSales] = useState(false);
  const [preInfo, setPreInfo] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  useEffect(() => {
    if (!recaptchaSiteKey) return;
    const renderBox = () => {
      if (!window.grecaptcha || !recaptchaRef.current || recaptchaWidgetId.current !== null) return;
      window.grecaptcha.ready(() => {
        if (!recaptchaRef.current || recaptchaWidgetId.current !== null) return;
        recaptchaWidgetId.current = window.grecaptcha!.render(recaptchaRef.current, {
          sitekey: recaptchaSiteKey,
          callback: (token: string) => setRecaptchaToken(token),
        });
      });
    };
    if (window.grecaptcha) {
      renderBox();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.onload = renderBox;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [recaptchaSiteKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/public/auth/me', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as {
        user?: { fullName?: string; email?: string; phone?: string } | null;
      };
      if (cancelled || !data.user) return;
      const u = data.user;
      const parts = (u.fullName ?? '').trim().split(/\s+/);
      const fn = parts[0] ?? '';
      const ln = parts.slice(1).join(' ') ?? '';
      setFirstName(fn);
      setLastName(ln);
      if (u.email) setEmail(u.email.trim());
      const parsed = parseProfilePhone(u.phone ?? '');
      if (parsed) {
        setPhoneCountry(parsed.cc);
        setPhone(parsed.national);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalGuests = adults + children + babies;

  const nights = nightsBetween(checkIn, checkOut);
  const dates = nightDates(checkIn, nights);
  const { sum: nightlySum, missingDates } = sumNightlyPrices(villa, dates);
  const shortStayFee =
    nights > 0 && nights < villa.minStayNights && villa.cleaningFee > 0 ? villa.cleaningFee : 0;
  const total = nightlySum + shortStayFee;
  const prepayment = villa.prepaymentPercent > 0 ? Math.round((total * villa.prepaymentPercent) / 100) : 0;
  const remainder = total - prepayment;
  const payNow = paymentPreference === 'full' ? total : prepayment;
  const fmt = (n: number) => formatVillaPrice(n, villa.paymentCurrency);

  const stayOk = isValidVillaStayRange(villa, checkIn, checkOut);
  const emailOk = user ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit =
    emailOk &&
    stayOk &&
    missingDates.length === 0 &&
    total > 0 &&
    totalGuests >= 1 &&
    adults >= 1;

  const gallerySorted = useMemo(
    () => [...villa.gallery].sort((a, b) => a.sortOrder - b.sortOrder),
    [villa.gallery],
  );
  const coverUrl = gallerySorted.find((g) => g.type === 'image')?.url;

  const submit = useCallback(async () => {
    setErr(null);
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr('Geçerli bir e-posta adresi girin.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErr('Ad ve soyad zorunludur.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErr('Geçerli telefon girin.');
      return;
    }
    if (!notTurkishCitizen) {
      const identityDigits = identityNumber.replace(/\D/g, '');
      if (identityDigits.length !== 11) {
        setErr('Geçerli bir T.C. Kimlik No girin.');
        return;
      }
    }
    if (!billingAddress.trim()) {
      setErr('Fatura adresi zorunludur.');
      return;
    }
    if (!legalIdentity || !distanceSales || !preInfo) {
      setErr('Tüm zorunlu onayları işaretleyin.');
      return;
    }
    const token = recaptchaSiteKey ? recaptchaToken : 'dev-pass';
    if (recaptchaSiteKey && !token) {
      setErr('Lütfen robot olmadığınızı doğrulayın.');
      return;
    }
    if (!canSubmit) {
      setErr('Seçilen tarihler veya misafir sayısı geçersiz.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/public/villa-pre-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          villaSlug: villa.slug,
          checkIn,
          checkOut,
          email: user ? undefined : email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneCountryCode: phoneCountry,
          phone: digits,
          identityNumber: notTurkishCitizen ? '' : identityNumber.replace(/\D/g, ''),
          foreignPhone,
          notTurkishCitizen,
          adults,
          children,
          babies,
          accommodationType,
          billingAddress: billingAddress.trim(),
          paymentPreference,
          referralSource,
          legalIdentityCommitment: legalIdentity,
          distanceSalesAccepted: distanceSales,
          preInfoAccepted: preInfo,
          recaptchaToken: token,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setErr(data.message ?? 'Gönderilemedi.');
        return;
      }
      router.replace('/villalar/on-rezervasyon?tesekkur=1');
    } catch {
      setErr('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    email,
    firstName,
    lastName,
    phone,
    identityNumber,
    phoneCountry,
    billingAddress,
    legalIdentity,
    distanceSales,
    preInfo,
    recaptchaSiteKey,
    recaptchaToken,
    totalGuests,
    canSubmit,
    villa.slug,
    checkIn,
    checkOut,
    foreignPhone,
    notTurkishCitizen,
    adults,
    children,
    babies,
    accommodationType,
    paymentPreference,
    referralSource,
    router,
  ]);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16">
          <Link
            href={`/villalar/${encodeURIComponent(villa.slug)}`}
            className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Villa sayfası</span>
          </Link>
          <Link href="/" className="flex min-w-0 shrink-0 items-center justify-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 max-w-[140px] object-contain sm:h-9" />
            ) : (
              <span className="text-sm font-semibold text-teal-700">Bodrum Aktivite</span>
            )}
          </Link>
          <div className="w-20 sm:w-24" aria-hidden />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Online ön rezervasyon</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Bilgilerinizi eksiksiz doldurun; ekibimiz talebinizi inceledikten sonra sizinle iletişime geçecektir.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
          <div className="space-y-8">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Konaklama tarihi</h2>
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-left text-sm font-medium text-zinc-900 transition hover:border-zinc-300 hover:bg-white"
              >
                {formatTrRange(checkIn, checkOut)}
              </button>
              {!stayOk || missingDates.length > 0 ? (
                <p className="mt-2 text-xs text-amber-800">
                  Bu tarih aralığı villa müsaitlik ve fiyat kurallarına uygun değil; takvimden değiştirin.
                </p>
              ) : null}
            </section>

            <VillaBookingDateRangeModal
              villa={villa}
              checkIn={checkIn}
              checkOut={checkOut}
              open={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              onChange={({ checkIn: ci, checkOut: co }) => {
                setCheckIn(ci);
                setCheckOut(co);
              }}
            />

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Misafir sayısı</h2>
              <p className="mt-1 text-xs text-zinc-500">Yetişkin sayısı en fazla {maxCap} olabilir.</p>
              <div className="mt-4 space-y-3">
                <Stepper
                  label="Yetişkin"
                  hint="13 yaş ve üzeri"
                  value={adults}
                  min={1}
                  max={maxCap}
                  onChange={(n) => setAdults(Math.max(1, Math.min(maxCap, n)))}
                />
                <Stepper
                  label="Çocuk"
                  hint="2 – 12 yaş"
                  value={children}
                  min={0}
                  max={99}
                  onChange={(n) => setChildren(Math.max(0, n))}
                />
                <Stepper
                  label="Bebek"
                  hint="0 – 2 yaş"
                  value={babies}
                  min={0}
                  max={99}
                  onChange={(n) => setBabies(Math.max(0, n))}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">İletişim bilgileri</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Ad
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    className={inputClassName}
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  Soyad
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className={inputClassName}
                  />
                </label>
              </div>

              {user ? (
                <p className="mt-3 text-xs text-zinc-500">
                  E-posta (hesap): <span className="font-medium text-zinc-800">{user.email}</span>
                </p>
              ) : (
                <label className="mt-4 block text-sm font-medium text-zinc-700">
                  E-posta
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={inputClassName}
                  />
                </label>
              )}

              <div className="mt-5 space-y-3">
                <div>
                  <span id="phone-cc-label" className="text-sm font-medium text-zinc-700">
                    Ülke kodu
                  </span>
                  <select
                    value={phoneCountry}
                    onChange={(e) => setPhoneCountry(e.target.value)}
                    className={`${selectClassName} mt-1.5 block w-full max-w-[200px]`}
                    aria-labelledby="phone-cc-label"
                  >
                    <option value="+90">Türkiye (+90)</option>
                    <option value="+44">Birleşik Krallık (+44)</option>
                    <option value="+49">Almanya (+49)</option>
                  </select>
                </div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="villa-pre-phone">
                  Cep telefonu
                  <input
                    id="villa-pre-phone"
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="Örn. 5xx xxx xx xx"
                    className={inputClassName}
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="villa-pre-identity">
                  T.C. Kimlik No {!notTurkishCitizen ? '*' : '(opsiyonel)'}
                  <input
                    id="villa-pre-identity"
                    type="text"
                    name="identityNumber"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="11 haneli T.C. Kimlik No"
                    disabled={notTurkishCitizen}
                    required={!notTurkishCitizen}
                    className={inputClassName + (notTurkishCitizen ? ' cursor-not-allowed bg-zinc-100 text-zinc-500' : '')}
                  />
                </label>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={foreignPhone}
                  onChange={(e) => setForeignPhone(e.target.checked)}
                  className="mt-1"
                />
                <span>Yurt dışı telefon numarası kullanıyorum</span>
              </label>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={notTurkishCitizen}
                  onChange={(e) => {
                    setNotTurkishCitizen(e.target.checked);
                    if (e.target.checked) setIdentityNumber('');
                  }}
                  className="mt-1"
                />
                <span>T.C. vatandaşı değilim</span>
              </label>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Konaklama türü</h2>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                  <input
                    type="radio"
                    name="acc"
                    checked={accommodationType === 'family'}
                    onChange={() => setAccommodationType('family')}
                    className="text-teal-600"
                  />
                  <span className="text-sm font-medium">Aile konaklaması</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                  <input
                    type="radio"
                    name="acc"
                    checked={accommodationType === 'friends'}
                    onChange={() => setAccommodationType('friends')}
                    className="text-teal-600"
                  />
                  <span className="text-sm font-medium">Arkadaş grubu konaklaması</span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Fatura adresi</h2>
              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                Fatura bilgileriniz yasal düzenlemeler kapsamında saklanır; eksiksiz adres girin.
              </div>
              <textarea
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                rows={4}
                className="mt-4 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Mahalle, cadde, ilçe, il, posta kodu"
              />
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Ödeme tercihi (bilgilendirme)</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Ödeme bu adımda alınmaz; tercihiniz talebe işlenir. Kesin ödeme planı onay sonrası netleşir.
              </p>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer flex-col gap-1 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentPreference === 'full'}
                      onChange={() => setPaymentPreference('full')}
                      className="text-teal-600"
                    />
                    <span className="text-sm font-medium">Tam ödeme</span>
                  </div>
                  <span className="pl-7 text-xs text-zinc-500">Konaklama bedelinin tamamı tek ödemede.</span>
                </label>
                <label className="flex cursor-pointer flex-col gap-1 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentPreference === 'prepayment'}
                      onChange={() => setPaymentPreference('prepayment')}
                      className="text-teal-600"
                    />
                    <span className="text-sm font-medium">Ön ödeme</span>
                  </div>
                  <span className="pl-7 text-xs text-zinc-500">
                    Rezervasyonu garanti altına almak için ön ödeme; kalanı girişte.
                  </span>
                </label>
              </div>
              <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm">
                <span className="font-medium text-teal-900">Tahmini ödeyeceğiniz tutar: </span>
                <span className="font-bold tabular-nums text-teal-900">{fmt(payNow)}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <label className="block text-sm font-medium text-zinc-700">
                Bizi nereden duydunuz?
                <select
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className={selectClassName + ' mt-2'}
                >
                  <option value="">Seçiniz</option>
                  <option value="google">Google / arama motoru</option>
                  <option value="instagram">Instagram</option>
                  <option value="friend">Arkadaş tavsiyesi</option>
                  <option value="other">Diğer</option>
                </select>
              </label>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Onaylar</h2>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={legalIdentity}
                  onChange={(e) => setLegalIdentity(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Konaklama yerine girişte geçerli kimlik ibraz edeceğimi kabul ediyorum (yasal bildirim için).
                </span>
              </label>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={distanceSales}
                  onChange={(e) => setDistanceSales(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <Link
                    href="/sozlesmeler/mesafeli-satis-sozlesmesi"
                    className="font-semibold text-teal-700 hover:underline"
                    target="_blank"
                  >
                    Mesafeli satış sözleşmesi
                  </Link>
                  &apos;ni okudum, kabul ediyorum.
                </span>
              </label>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input type="checkbox" checked={preInfo} onChange={(e) => setPreInfo(e.target.checked)} className="mt-1" />
                <span>
                  <Link
                    href="/sozlesmeler/on-bilgilendirme-formu"
                    className="font-semibold text-teal-700 hover:underline"
                    target="_blank"
                  >
                    Ön bilgilendirme formu
                  </Link>
                  &apos;nu okudum, kabul ediyorum.
                </span>
              </label>

              {recaptchaSiteKey ? (
                <div className="mt-6 flex justify-center">
                  <div ref={recaptchaRef} />
                </div>
              ) : (
                <p className="mt-4 text-xs text-amber-800">Geliştirme: reCAPTCHA kapalı (site anahtarı yok).</p>
              )}

              {err && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
              )}

              <button
                type="button"
                disabled={loading || !canSubmit}
                onClick={() => void submit()}
                className="mt-6 w-full rounded-full bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor…' : 'Ön rezervasyon talebini gönder'}
              </button>
              <p className="mt-3 text-center text-xs text-zinc-500">
                Ödeme bu sayfada tahsil edilmez; talebiniz ekibe iletilir.
              </p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {coverUrl ? (
                <div className="relative aspect-[16/10] w-full bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="p-5">
                <h3 className="font-semibold text-zinc-900">{villa.displayName}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {[villa.district, villa.city].filter(Boolean).join(', ')} · {villa.guestCount} kişi
                </p>
                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
                  <div className="flex justify-between gap-2 text-zinc-600">
                    <span>
                      Konaklama ({nights} gece)
                    </span>
                    <span className="font-medium tabular-nums text-zinc-900">{fmt(nightlySum)}</span>
                  </div>
                  {shortStayFee > 0 && (
                    <div className="flex justify-between gap-2 text-zinc-600">
                      <span>Kısa konaklama / temizlik</span>
                      <span className="font-medium tabular-nums text-zinc-900">{fmt(shortStayFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
                    <span>Toplam (tahmini)</span>
                    <span className="tabular-nums">{fmt(total)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-sm text-zinc-600">
                    <span>Şimdi ödenecek (tercihe göre)</span>
                    <span className="font-medium tabular-nums text-zinc-900">{fmt(payNow)}</span>
                  </div>
                  {paymentPreference === 'prepayment' && (
                    <div className="flex justify-between gap-2 text-sm text-zinc-600">
                      <span>Konaklamada ödenecek (tahmini)</span>
                      <span className="font-medium tabular-nums text-zinc-900">{fmt(remainder)}</span>
                    </div>
                  )}
                </div>
                {villa.damageDeposit > 0 && (
                  <div className="mt-4 space-y-1 rounded-lg bg-zinc-50 px-3 py-2">
                    <p className="text-xs text-zinc-600">
                      Hasar depozitosu: <span className="font-semibold tabular-nums text-zinc-900">{fmt(villa.damageDeposit)}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500">Giriş sırasında villa sahibine ödenir.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
