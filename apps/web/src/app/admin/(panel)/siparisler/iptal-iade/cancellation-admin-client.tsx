'use client';

import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { CancellationRequest } from '@/types/cancellation-request';

export function CancellationAdminClient() {
  const [rows, setRows] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cancellation-requests', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { requests?: CancellationRequest[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setRows(data.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/cancellation-requests', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'İşlem başarısız');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">İptal / İade Yönetimi</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Müşteri iptal talepleri. Onaylamak için tik, reddetmek için çarpı kullanın.
      </p>

      {loading && <p className="mt-6 text-zinc-600">Yükleniyor…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Kayıt yok.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3 font-semibold">Tarih</th>
              <th className="px-4 py-3 font-semibold">Sipariş</th>
              <th className="px-4 py-3 font-semibold">E-posta</th>
              <th className="px-4 py-3 font-semibold">Neden</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 font-semibold text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {new Date(r.createdAt).toLocaleString('tr-TR')}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.orderNo}</td>
                <td className="max-w-[180px] truncate px-4 py-3">{r.userEmail}</td>
                <td className="max-w-xs px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.reason}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      Bekliyor
                    </span>
                  )}
                  {r.status === 'approved' && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                      Onaylandı
                    </span>
                  )}
                  {r.status === 'rejected' && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                      Reddedildi
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === 'pending' ? (
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void patch(r.id, 'approve')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                        title="İptali onayla"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void patch(r.id, 'reject')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                        title="Talebi reddet"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
