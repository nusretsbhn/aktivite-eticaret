import Link from 'next/link';
import { notFound } from 'next/navigation';

import { readOrders } from '@/lib/orders-server';

export const metadata = {
  title: 'Bilet doğrulama',
  robots: { index: false, follow: false },
};

export default async function BiletVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orders = await readOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();

  const valid = order.status !== 'cancelled';

  return (
    <div className="min-h-[60vh] bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bodrum Aktivite</p>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">Bilet kontrolü</h1>
        {valid ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">Bu QR kod geçerli bir siparişe aittir.</p>
        ) : (
          <p className="mt-3 text-sm font-medium text-red-700">Bu sipariş iptal edilmiş veya geçersiz.</p>
        )}
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Sipariş no</dt>
            <dd className="font-mono font-semibold text-zinc-900">{order.orderNo}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Yolcu</dt>
            <dd className="text-right font-medium text-zinc-900">{order.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Tur</dt>
            <dd className="text-right text-zinc-800">{order.tourName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Tarih</dt>
            <dd className="text-zinc-800">{order.date || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Kişi</dt>
            <dd className="text-zinc-800">{order.peopleCount}</dd>
          </div>
        </dl>
        <Link href="/" className="mt-8 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
