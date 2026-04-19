'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X } from 'lucide-react';

type Row = {
  id: string;
  status: 'NEW' | 'PROCESSED';
  createdAt: string;
  customerName: string;
  phone: string;
  kvkkApproved: boolean;
  commercialApproved: boolean;
  packageTourId: string;
  packageTourName: string;
  conceptName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  packageTotal: number;
  extraTotal: number;
  grandTotal: number;
  extras: Array<{
    activityId: string;
    activityName: string;
    adults: number;
    children: number;
    infants: number;
    total: number;
  }>;
};

export function PackageTourRequestsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Row | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/package-tour-requests', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: Row[] };
      setRows(Array.isArray(data.requests) ? data.requests : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: 'NEW' | 'PROCESSED') {
    const res = await fetch(`/api/admin/package-tour-requests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { request?: Row };
    if (data.request) setRows((prev) => prev.map((r) => (r.id === id ? data.request! : r)));
  }

  const modal = detail ? (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Paket Tur Talep Detayı</h2>
          <button type="button" onClick={() => setDetail(null)} className="rounded p-1.5 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <pre className="mt-4 max-h-[70vh] overflow-auto rounded-lg bg-zinc-50 p-3 text-xs">{JSON.stringify(detail, null, 2)}</pre>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Paket Tur Talepleri</h1>
      <p className="mt-1 text-sm text-zinc-600">Yeni gelenler YENİ durumunda görünür; işlendikçe İŞLENDİ yapabilirsiniz.</p>
      {loading ? (
        <p className="mt-4 text-zinc-500">Yükleniyor…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">Paket</th>
                <th className="px-4 py-3 font-semibold">İletişim</th>
                <th className="px-4 py-3 font-semibold">Toplam</th>
                <th className="px-4 py-3 text-right font-semibold">Detay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => void setStatus(r.id, e.target.value === 'PROCESSED' ? 'PROCESSED' : 'NEW')}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs font-semibold"
                    >
                      <option value="NEW">YENİ</option>
                      <option value="PROCESSED">İŞLENDİ</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{r.packageTourName}</div>
                    <div className="text-xs text-zinc-500">{r.checkIn} → {r.checkOut} · {r.nights} gece</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{r.customerName}</div>
                    <div className="text-xs text-zinc-500">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{r.grandTotal.toLocaleString('tr-TR')} TL</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setDetail(r)} className="inline-flex rounded-lg border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-50" title="Detay">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  );
}

