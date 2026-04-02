'use client';

import Link from 'next/link';
import { useState } from 'react';

type CancelResponse = { success?: boolean; error?: string };

export default function TicketCancelRequestPage() {
  const [orderNo, setOrderNo] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/public/tickets/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, email, reason }),
      });
      const data = (await res.json()) as CancelResponse;
      if (!res.ok || !data.success) {
        setError(data.error ?? 'İptal talebi gönderilemedi.');
        return;
      }
      setOk('İptal talebiniz alınmıştır.');
      setReason('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-extrabold text-zinc-900">Bilet İptal Talebi</h1>
          <p className="mt-1 text-sm text-zinc-600">Bilet numarasıyla iptal talebi oluşturabilirsiniz.</p>

          <div className="mt-4 space-y-3">
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Bilet No"
              className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta (opsiyonel)"
              className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="İptal nedeni (min. 5 karakter)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </div>

          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          {ok && <p className="mt-3 text-sm font-medium text-emerald-700">{ok}</p>}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
            </button>
          </div>

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

