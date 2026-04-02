'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Circle, Eye, X } from 'lucide-react';

import type { VillaPreReservationFormDetails } from '@/lib/villa-requests-server';

type Row = {
  id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  phone: string;
  villaSlug: string;
  villaDisplayName?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  formDetails?: VillaPreReservationFormDetails;
  isRead: boolean;
  createdAt: string;
};

export function VillaRequestsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch('/api/admin/villa-requests', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        setErr('Liste yüklenemedi.');
        return;
      }
      const data = (await res.json()) as { requests?: Row[] };
      setRows(Array.isArray(data.requests) ? data.requests : []);
    } catch {
      setErr('Ağ hatası.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRead = async (id: string, next: boolean) => {
    try {
      const res = await fetch(`/api/admin/villa-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: next }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { request?: Row };
      if (data.request) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: data.request!.isRead } : r)));
      }
    } catch {
      /* ignore */
    }
  };

  const detailModal = detail ? (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setDetail(null);
      }}
    >
        <div
          className="max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="villa-req-detail-title"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id="villa-req-detail-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Talep detayı
            </h2>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Kayıt ID</dt>
              <dd className="break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">{detail.id}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Oluşturulma</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {new Date(detail.createdAt).toLocaleString('tr-TR')}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Üye</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {detail.userId === 'guest' ? (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                    Giriş yapmadan (misafir)
                  </span>
                ) : (
                  <span className="font-mono text-xs">{detail.userId ?? '—'}</span>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Ad soyad</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">{detail.userName}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">E-posta</dt>
              <dd className="break-all text-zinc-800 dark:text-zinc-200">{detail.userEmail}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Telefon</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">{detail.phone}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Villa</dt>
              <dd>
                <Link
                  href={`/villalar/${encodeURIComponent(detail.villaSlug)}`}
                  className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                  target="_blank"
                >
                  {detail.villaDisplayName ?? detail.villaSlug}
                </Link>
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800">
              <dt className="font-medium text-zinc-500">Konaklama</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {detail.checkIn} → {detail.checkOut} · {detail.guests} misafir
              </dd>
            </div>
          </dl>

          {detail.formDetails ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Form detayları</h3>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {JSON.stringify(detail.formDetails, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">Bu kayıtta genişletilmiş form alanı yok.</p>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ham kayıt (JSON)</h3>
            <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-zinc-100 p-4 text-[11px] leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {JSON.stringify(detail, null, 2)}
            </pre>
          </div>
        </div>
      </div>
  ) : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Villa Talepleri</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ön rezervasyon talepleri. Okundu bilgisini işaretleyebilir veya satırdaki göz ile tüm alanları görebilirsiniz.
        </p>
      </div>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

      {loading ? (
        <p className="text-zinc-500">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <p className="text-zinc-500">Henüz talep yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">Durum</th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">Tarih</th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">Misafir</th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">Villa</th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">Konaklama</th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">İletişim</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">Detay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 ${r.isRead ? 'opacity-80' : 'bg-amber-50/50 dark:bg-amber-950/20'}`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void toggleRead(r.id, !r.isRead)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      title={r.isRead ? 'Okunmadı işaretle' : 'Okundu işaretle'}
                    >
                      {r.isRead ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden /> Okundu
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 text-amber-600" aria-hidden /> Okunmadı
                        </>
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {new Date(r.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">{r.guests}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/villalar/${encodeURIComponent(r.villaSlug)}`}
                      className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                      target="_blank"
                    >
                      {r.villaDisplayName ?? r.villaSlug}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {r.checkIn} → {r.checkOut}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.userName}</div>
                    <div className="text-xs text-zinc-500">{r.userEmail}</div>
                    <div className="text-xs text-zinc-500">{r.phone}</div>
                    {r.formDetails && (
                      <div className="mt-2 max-w-[280px] text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                        {typeof r.formDetails.adults === 'number' && (
                          <span>
                            Yetişkin {r.formDetails.adults}
                            {typeof r.formDetails.children === 'number' ? ` · Çocuk ${r.formDetails.children}` : ''}
                            {typeof r.formDetails.babies === 'number' ? ` · Bebek ${r.formDetails.babies}` : ''}
                            {' · '}
                          </span>
                        )}
                        {r.formDetails.accommodationType === 'friends' ? 'Arkadaş grubu' : 'Aile'}
                        {' · '}
                        {r.formDetails.paymentPreference === 'full' ? 'Tam ödeme tercihi' : 'Ön ödeme tercihi'}
                        {r.formDetails.referralSource ? ` · Kaynak: ${r.formDetails.referralSource}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetail(r)}
                      className="inline-flex rounded-lg border border-zinc-300 p-2 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      title="Tüm bilgileri göster"
                      aria-label="Tüm bilgileri göster"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mounted && detailModal ? createPortal(detailModal, document.body) : null}
    </div>
  );
}
