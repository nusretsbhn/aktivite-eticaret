'use client';

import Link from 'next/link';
import { useState } from 'react';

type TicketLookupResponse = {
  ticket?: {
    orderNo: string;
    tourName: string;
    date: string;
    peopleCount: number;
    status: 'new' | 'completed' | 'cancelled';
    paymentType: 'transfer' | 'credit_card' | 'ask_sell';
    paymentPlan: 'full' | 'prepayment';
    totalAmount: number;
    pendingCancel: boolean;
  };
  error?: string;
};

function fmtTry(n: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n || 0);
}

export default function TicketLookupPage() {
  const [orderNo, setOrderNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketLookupResponse['ticket'] | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setTicket(null);
    try {
      const res = await fetch('/api/public/tickets/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo }),
      });
      const data = (await res.json()) as TicketLookupResponse;
      if (!res.ok || !data.ticket) {
        setError(data.error ?? 'Bilet bulunamadı.');
        return;
      }
      setTicket(data.ticket);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-extrabold text-zinc-900">Bilet Sorgula</h1>
          <p className="mt-1 text-sm text-zinc-600">Bilet numarasını girerek durum bilgisine ulaşabilirsiniz.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Örn. BDO-20260402-ABC123"
              className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void lookup()}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Sorgulanıyor...' : 'Sorgula'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

          {ticket && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
              <p className="font-semibold text-zinc-900">Bilet No: {ticket.orderNo}</p>
              <p>Tur: {ticket.tourName}</p>
              <p>Tarih: {ticket.date}</p>
              <p>Kişi: {ticket.peopleCount}</p>
              <p>Ödeme Planı: {ticket.paymentPlan === 'full' ? 'Tam Ödemeli' : 'Ön Ödemeli'}</p>
              <p>Tutar: {fmtTry(ticket.totalAmount)} TRY</p>
              <p>Durum: {ticket.status === 'cancelled' ? 'İptal edildi' : ticket.status === 'completed' ? 'Tamamlandı' : 'Yeni/Beklemede'}</p>
              {ticket.pendingCancel && <p className="mt-1 font-medium text-amber-700">İptal talebi beklemede.</p>}
            </div>
          )}

          <div className="mt-6">
            <Link href="/" className="text-sm font-semibold text-blue-700 underline">
              Ana sayfaya dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

