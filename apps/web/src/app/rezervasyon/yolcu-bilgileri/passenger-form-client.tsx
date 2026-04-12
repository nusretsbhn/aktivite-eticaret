'use client';

import Link from 'next/link';
import { FileText, ReceiptText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSiteAuth } from '@/components/site/site-auth-provider';

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const t = fullName.trim();
  if (!t) return { firstName: '', lastName: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/** Kayıtlı telefonu form alanlarına böler (varsayılan ülke +90). */
function parsePhoneForForm(phone: string): { countryCode: string; local: string } {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return { countryCode: '+90', local: '' };
  if (digits.startsWith('90') && digits.length >= 12) {
    return { countryCode: '+90', local: digits.slice(2, 12) };
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return { countryCode: '+90', local: digits.slice(1) };
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    return { countryCode: '+90', local: digits };
  }
  if (digits.length > 10) {
    return { countryCode: '+90', local: digits.slice(-10) };
  }
  return { countryCode: '+90', local: digits };
}

type PassengerDraft = {
  firstName: string;
  lastName: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  tcNo: string;
  isForeignCitizen: boolean;
  gender: 'female' | 'male';
};

function passengerSlotLabel(idx: number, adultsCount: number, childrenCount: number, infantsCount: number): string {
  if (idx < adultsCount) return `${idx + 1}. Yetişkin (+13)`;
  if (idx < adultsCount + childrenCount) return `${idx - adultsCount + 1}. Çocuk (3-12)`;
  if (idx < adultsCount + childrenCount + infantsCount) return `${idx - adultsCount - childrenCount + 1}. Bebek (0-2)`;
  return `${idx + 1}. Kişi`;
}

export function PassengerFormClient({
  nextUrl,
  peopleCount,
  adultsCount,
  childrenCount,
  infantsCount,
  isFamilyBoat = false,
  bookingBlocked = false,
  bookingMessage,
}: {
  nextUrl: string;
  peopleCount: number;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  isFamilyBoat?: boolean;
  bookingBlocked?: boolean;
  bookingMessage?: string;
}) {
  const router = useRouter();
  const { user, authReady } = useSiteAuth();
  const [invoiceType, setInvoiceType] = useState<'personal' | 'corporate'>('personal');
  const [contactEmail, setContactEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [contactPhone, setContactPhone] = useState('');
  const [passengers, setPassengers] = useState<PassengerDraft[]>(
    Array.from({ length: Math.max(1, peopleCount) }, () => ({
      firstName: '',
      lastName: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      tcNo: '',
      isForeignCitizen: false,
      gender: 'male',
    })),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !user) return;
    const parsed = parsePhoneForForm(user.phone);
    setContactEmail((e) => (e.trim() ? e : user.email));
    setContactPhone((p) => {
      if (p.trim()) return p;
      setCountryCode(parsed.countryCode);
      return parsed.local;
    });
    setPassengers((prev) => {
      const { firstName: fn, lastName: ln } = splitFullName(user.fullName);
      return prev.map((row, i) => {
        if (i !== 0) return row;
        if (row.firstName.trim() || row.lastName.trim()) return row;
        return { ...row, firstName: fn, lastName: ln };
      });
    });
  }, [authReady, user]);

  function validateAndContinue() {
    if (bookingBlocked) {
      setError(bookingMessage ?? 'Bu tur için rezervasyon yapılamaz.');
      return;
    }
    if (!contactEmail.trim() || !contactPhone.trim()) {
      setError('İletişim bilgilerini doldurmadan devam edemezsiniz.');
      return;
    }
    for (let i = 0; i < passengers.length; i += 1) {
      const p = passengers[i];
      if (!p.firstName.trim() || !p.lastName.trim()) {
        setError(`${i + 1}. kişi ad ve soyad bilgisi zorunludur.`);
        return;
      }
      if (!p.birthDay || !p.birthMonth || !p.birthYear) {
        setError(`${i + 1}. kişi doğum tarihi zorunludur.`);
        return;
      }
      if (!p.isForeignCitizen && !p.tcNo.trim()) {
        setError(`${i + 1}. kişi için T.C. Kimlik No zorunludur.`);
        return;
      }
    }
    setError(null);
    const url = new URL(nextUrl, window.location.origin);
    const mapped = passengers.map((p) => ({
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      fullName: `${p.firstName} ${p.lastName}`.trim(),
      birthDate: `${p.birthYear}-${p.birthMonth}-${p.birthDay}`,
      ...(p.isForeignCitizen ? {} : { tcNo: p.tcNo.trim() }),
      isForeignCitizen: p.isForeignCitizen,
      gender: p.gender,
    }));
    if (isFamilyBoat && mapped.length > 0 && mapped.every((p) => p.gender === 'male')) {
      setError('İlgili aktivite aile konseptli aktivitedir. Sadece erkek olarak işlem yapmamaktadır.');
      return;
    }
    url.searchParams.set('fullName', mapped[0]?.fullName ?? '');
    url.searchParams.set('countryCode', countryCode);
    url.searchParams.set('phone', contactPhone.trim());
    url.searchParams.set('email', contactEmail.trim());
    url.searchParams.set('passengers', JSON.stringify(mapped));
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  function setPassengerField<K extends keyof PassengerDraft>(idx: number, key: K, value: PassengerDraft[K]) {
    setPassengers((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  }

  return (
    <section className="space-y-4">
      {bookingBlocked && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          <p className="font-semibold">{bookingMessage ?? 'Bu tur için rezervasyon yapılamaz.'}</p>
          <Link href="/aktiviteler" className="mt-2 inline-block font-medium text-red-800 underline dark:text-red-200">
            Aktivitelere dön
          </Link>
        </div>
      )}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-zinc-900">İletişim Bilgisi</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-500">
            E-posta adresiniz
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Cep telefonunuz
            <div className="mt-1 grid grid-cols-[90px_1fr] gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="min-h-11 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900"
              >
                <option value="+90">+90</option>
                <option value="+49">+49</option>
                <option value="+44">+44</option>
                <option value="+31">+31</option>
                <option value="+1">+1</option>
              </select>
              <input
                type="tel"
                placeholder="5xx xxx xx xx"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </div>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-xs text-zinc-500">
          <p>Tur ve bilet bilgilerinizi e-posta ve ücretsiz SMS yoluyla ileteceğiz.</p>
          <span className="font-semibold text-zinc-700">Ücretsiz SMS</span>
        </div>
      </div>

      {passengers.map((passenger, idx) => (
        <div key={`p-${idx}`} className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">
              {passengerSlotLabel(idx, adultsCount, childrenCount, infantsCount)}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-500">
            Ad
            <input
              type="text"
              value={passenger.firstName}
              onChange={(e) => setPassengerField(idx, 'firstName', e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Soyad
            <input
              type="text"
              value={passenger.lastName}
              onChange={(e) => setPassengerField(idx, 'lastName', e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Doğum Tarihi
            <div className="mt-1 grid grid-cols-3 gap-2">
              <select
                value={passenger.birthDay}
                onChange={(e) => setPassengerField(idx, 'birthDay', e.target.value)}
                className="min-h-11 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900"
              >
                <option value="">Gün</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={passenger.birthMonth}
                onChange={(e) => setPassengerField(idx, 'birthMonth', e.target.value)}
                className="min-h-11 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900"
              >
                <option value="">Ay</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={passenger.birthYear}
                onChange={(e) => setPassengerField(idx, 'birthYear', e.target.value)}
                className="min-h-11 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900"
              >
                <option value="">Yıl</option>
                {Array.from({ length: 90 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="block text-xs text-zinc-500">
            T.C. Kimlik No
            <input
              type="text"
              disabled={passenger.isForeignCitizen}
              value={passenger.tcNo}
              onChange={(e) => setPassengerField(idx, 'tcNo', e.target.value)}
              placeholder={passenger.isForeignCitizen ? 'T.C. vatandaşı değil seçildi' : ''}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            />
            <span className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={passenger.isForeignCitizen}
                onChange={(e) => {
                  setPassengerField(idx, 'isForeignCitizen', e.target.checked);
                  if (e.target.checked) setPassengerField(idx, 'tcNo', '');
                }}
              />
              T.C. vatandaşı değil
            </span>
          </label>
          <div className="sm:col-span-2">
            <p className="text-xs text-zinc-500">Cinsiyet</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name={`gender-${idx}`}
                  checked={passenger.gender === 'female'}
                  onChange={() => setPassengerField(idx, 'gender', 'female')}
                />
                Kadın
              </label>
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name={`gender-${idx}`}
                  checked={passenger.gender === 'male'}
                  onChange={() => setPassengerField(idx, 'gender', 'male')}
                />
                Erkek
              </label>
            </div>
          </div>
        </div>
      </div>
      ))}

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <FileText className="h-4 w-4" />
            Fatura Bilgileri
          </p>
          <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ReceiptText className="h-4 w-4" />
            Fatura listesinden seç
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-600">Fatura Tipi</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name="invoiceType"
                  checked={invoiceType === 'personal'}
                  onChange={() => setInvoiceType('personal')}
                />
                Bireysel
              </label>
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name="invoiceType"
                  checked={invoiceType === 'corporate'}
                  onChange={() => setInvoiceType('corporate')}
                />
                Kurumsal
              </label>
            </div>
          </div>

          <label className="block text-xs text-zinc-500">
            {invoiceType === 'corporate' ? 'Firma Ünvanı' : 'Ad Soyad'}
            <input
              type="text"
              placeholder={invoiceType === 'corporate' ? 'Firma ünvanı' : 'Ad Soyad'}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>

          {invoiceType === 'corporate' && (
            <label className="block text-xs text-zinc-500">
              Vergi Numarası
              <input
                type="text"
                placeholder="Vergi numarası"
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
          )}

          <label className="block text-xs text-zinc-500">
            Fatura Adresi
            <textarea
              rows={4}
              placeholder="-"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              İl
              <input
                type="text"
                placeholder="-"
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              İlçe
              <input
                type="text"
                placeholder="-"
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={validateAndContinue}
          disabled={bookingBlocked}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ödemeye İlerle →
        </button>
      </div>
    </section>
  );
}

