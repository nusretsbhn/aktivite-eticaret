'use client';

import Link from 'next/link';
import { Building2, CreditCard, Handshake } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { OrderPaymentPlan, OrderPaymentType } from '@/types/order';

export function PaymentFormClient({
  creditCardEnabled,
  transferEnabled,
  transferBankName,
  transferAccountHolder,
  transferIban,
  askSellOnly = false,
  activityId,
  tourName,
  departurePlace,
  location,
  tripInfo,
  date,
  people,
  adults,
  children,
  infants,
  totalAmount,
  grossTotalAmount,
  prepaymentPercent,
  paymentPlan,
  unitPrice,
  fullName,
  firstName,
  lastName,
  countryCode,
  phone,
  email,
  birthDate,
  tcNo,
  isForeignCitizen,
  gender,
  passengers,
  bookingBlocked = false,
  bookingMessage,
}: {
  creditCardEnabled: boolean;
  transferEnabled: boolean;
  transferBankName?: string;
  transferAccountHolder?: string;
  transferIban?: string;
  askSellOnly?: boolean;
  activityId: string;
  tourName: string;
  departurePlace: string;
  location: string;
  tripInfo?: string;
  date: string;
  people: number;
  adults: number;
  children: number;
  infants: number;
  totalAmount: number;
  grossTotalAmount: number;
  prepaymentPercent: number;
  paymentPlan: OrderPaymentPlan;
  unitPrice: number;
  fullName: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  email: string;
  birthDate: string;
  tcNo: string;
  isForeignCitizen: boolean;
  gender: 'female' | 'male';
  passengers?: Array<{
    firstName: string;
    lastName: string;
    fullName: string;
    birthDate: string;
    tcNo?: string;
    isForeignCitizen: boolean;
    gender: 'female' | 'male';
  }>;
  bookingBlocked?: boolean;
  bookingMessage?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedMethod = useMemo<OrderPaymentType>(() => {
    if (askSellOnly) return 'ask_sell';
    if (transferEnabled) return 'transfer';
    if (creditCardEnabled) return 'credit_card';
    return 'transfer';
  }, [askSellOnly, creditCardEnabled, transferEnabled]);
  const [paymentType, setPaymentType] = useState<OrderPaymentType>(selectedMethod);

  async function complete() {
    if (bookingBlocked) {
      setError(bookingMessage ?? 'Bu tur için rezervasyon yapılamaz.');
      return;
    }
    if (!askSellOnly && !transferEnabled && !creditCardEnabled) {
      setError('Aktif ödeme yöntemi bulunmuyor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          activityId,
          tourName,
          departurePlace,
          location,
          tripInfo,
          date,
          peopleCount: people,
          adults,
          children,
          infants,
          unitPrice,
          totalAmount,
          grossTotalAmount,
          prepaymentPercent,
          paymentPlan,
          paymentType,
          transferPaid: paymentType === 'transfer' ? false : undefined,
          firstName,
          lastName,
          countryCode,
          birthDate,
          tcNo,
          isForeignCitizen,
          gender,
          passengers,
        }),
      });
      const data = (await res.json()) as { error?: string; orderNo?: string };
      if (!res.ok || !data.orderNo) {
        setError(data.error ?? 'Sipariş oluşturulamadı.');
        return;
      }
      router.push(`/rezervasyon/siparis-alindi?orderNo=${encodeURIComponent(data.orderNo)}`);
    } finally {
      setLoading(false);
    }
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
        <p className="mb-3 text-sm font-semibold text-zinc-900">Ödeme</p>
        <div className={`grid gap-2 ${askSellOnly ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
          {askSellOnly ? (
            <button
              type="button"
              onClick={() => setPaymentType('ask_sell')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
            >
              <Handshake className="h-4 w-4" />
              Sor Sat Ödeme Yöntemi
            </button>
          ) : (
            <>
          <button
            type="button"
            disabled={!creditCardEnabled}
            onClick={() => setPaymentType('credit_card')}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              !creditCardEnabled
                ? 'border-zinc-300 bg-zinc-100 text-zinc-400 disabled:cursor-not-allowed'
                : paymentType === 'credit_card'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            {creditCardEnabled ? 'Kartla Ödeme' : 'Kartla Ödeme (Yakında)'}
          </button>
          <button
            type="button"
            disabled={!transferEnabled}
            onClick={() => setPaymentType('transfer')}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              !transferEnabled
                ? 'border-zinc-300 bg-zinc-100 text-zinc-400 disabled:cursor-not-allowed'
                : paymentType === 'transfer'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            <Building2 className="h-4 w-4" />
            {transferEnabled ? 'Havale ile Ödeme' : 'Havale Kapalı'}
          </button>
            </>
          )}
        </div>
        {!askSellOnly && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            İyzico ve kredi kartı entegrasyonu sonraki adımda eklenecek.
          </div>
        )}
        {askSellOnly && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Bu aktivite için Sor Sat süreci aktiftir. Talebiniz satış ekibimize iletilecektir.
          </div>
        )}
        {paymentType === 'transfer' && (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Havale Bilgileri</p>
            <p className="mt-1">Banka: {transferBankName || '-'}</p>
            <p>Hesap Sahibi: {transferAccountHolder || '-'}</p>
            <p>IBAN: {transferIban || '-'}</p>
          </div>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void complete()}
            disabled={loading || bookingBlocked}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70"
          >
            {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
          </button>
        </div>
      </div>
    </section>
  );
}

