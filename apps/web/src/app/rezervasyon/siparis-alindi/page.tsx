import Link from 'next/link';

import { readOrders } from '@/lib/orders-server';
import { readSettings } from '@/lib/admin-settings-server';

function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount || 0);
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const orderNo = typeof sp.orderNo === 'string' ? sp.orderNo : '';
  const [orders, settings] = await Promise.all([readOrders(), readSettings()]);
  const order = orders.find((o) => o.orderNo === orderNo);
  const payment = settings.paymentManagement;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
          {order?.orderKind === 'ask_sell' && (
            <h1 className="text-2xl font-extrabold text-zinc-900">
              Ön Rezervasyon Talebiniz alınmıştır. Satış ekibimiz sizinle en kısa sürede iletişime geçecektir.
            </h1>
          )}
          {order?.orderKind !== 'ask_sell' && (
            <h1 className="text-2xl font-extrabold text-zinc-900">Siparişiniz Alınmıştır</h1>
          )}
          <p className="mt-2 text-sm text-zinc-600">
            Sipariş numaranız: <span className="font-semibold text-zinc-900">{order?.orderNo || '-'}</span>
          </p>

          {order && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p>Tur: {order.tourName}</p>
              <p>Kişi Sayısı: {order.peopleCount}</p>
              <p>
                Ödeme Tipi:{' '}
                {order.paymentType === 'transfer'
                  ? 'Havale'
                  : order.paymentType === 'credit_card'
                    ? 'Kredi Kartı'
                    : 'Sor Sat'}
              </p>
              <p className="font-semibold">Toplam: {formatTry(order.totalAmount)} TRY</p>
            </div>
          )}

          {order?.paymentType === 'transfer' && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Havale Bilgileri</p>
              <p className="mt-1">Banka: {payment?.transferBankName || '-'}</p>
              <p>Hesap Sahibi: {payment?.transferAccountHolder || '-'}</p>
              <p>IBAN: {payment?.transferIban || '-'}</p>
            </div>
          )}

          <div className="mt-7 flex justify-end">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

