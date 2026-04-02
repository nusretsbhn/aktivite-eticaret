'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TicketPdfPreview } from '@/components/site/ticket-pdf-preview';
import { isOrderTicketEligible } from '@/lib/order-ticket-eligibility';
import { useSiteAuth } from '@/components/site/site-auth-provider';
import { SiteNotificationBell } from '@/components/site/site-notification-bell';
import { SiteFooter } from '@/components/site/site-footer';
import type { AdminSettings } from '@/types/admin-settings';
import type { Order } from '@/types/order';

type OrderRow = Order & { pendingCancelRequest?: boolean };

function fmtTry(n: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR').format(new Date(y, (m || 1) - 1, d || 1));
}

function paymentPlanLabel(plan?: Order['paymentPlan']) {
  return plan === 'full' ? 'Tam Ödemeli' : 'Ön Ödemeli';
}

export function HesapSiparislerClient({
  logoUrl,
  socialMedia,
  footerManagement,
}: {
  logoUrl?: string;
  socialMedia?: AdminSettings['socialMedia'];
  footerManagement?: AdminSettings['footerManagement'];
}) {
  const router = useRouter();
  const { user, authReady } = useSiteAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<OrderRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);
  const [ticketPreview, setTicketPreview] = useState<OrderRow | null>(null);

  useEffect(() => {
    if (authReady && !user) {
      router.replace('/');
    }
  }, [authReady, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/public/me/orders', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { orders?: OrderRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Siparişler alınamadı');
      setOrders(data.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authReady && user) void load();
  }, [authReady, user, load]);

  async function submitCancel() {
    if (!cancelOrder) return;
    const reason = cancelReason.trim();
    if (reason.length < 5) {
      setCancelErr('En az 5 karakter yazın.');
      return;
    }
    setCancelErr(null);
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/public/orders/${encodeURIComponent(cancelOrder.id)}/cancel-request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setCancelErr(data.error ?? 'İptal talebi gönderilemedi.');
        return;
      }
      setCancelOrder(null);
      setCancelReason('');
      await load();
    } finally {
      setCancelLoading(false);
    }
  }

  if (!authReady || !user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-600">Yükleniyor…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/hesap" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              Hesap Bilgileri
            </Link>
            <SiteNotificationBell />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-extrabold text-zinc-900">Siparişlerim</h1>
        <p className="mt-1 text-sm text-zinc-600">Geçmiş ve güncel siparişleriniz.</p>

        {loading && <p className="mt-6 text-zinc-600">Yükleniyor…</p>}
        {error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">Henüz siparişiniz yok.</p>
        )}

        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:border-zinc-200"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold text-zinc-500">{o.orderNo}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900">{o.tourName}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {fmtDate(o.date)} · {o.peopleCount} kişi · {fmtTry(o.totalAmount)} TRY
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Ödeme Planı: {paymentPlanLabel(o.paymentPlan)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Durum:{' '}
                    {o.status === 'cancelled'
                      ? 'İptal edildi'
                      : o.status === 'completed'
                        ? 'Tamamlandı'
                        : 'Yeni / Beklemede'}
                  </p>
                  {o.pendingCancelRequest && (
                    <p className="mt-2 text-sm font-medium text-amber-700">İptal talebi yönetici onayında</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!isOrderTicketEligible(o)}
                    title={
                      isOrderTicketEligible(o)
                        ? 'PDF bileti aç'
                        : 'Havale siparişlerinde ödeme onaylandıktan sonra bilet oluşur.'
                    }
                    onClick={() => {
                      if (!isOrderTicketEligible(o)) return;
                      setTicketPreview(o);
                    }}
                    className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${
                      isOrderTicketEligible(o)
                        ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                        : 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    PDF Bilet
                  </button>
                  {o.status !== 'cancelled' &&
                    !o.pendingCancelRequest &&
                    (o.status === 'new' || o.status === 'completed') && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelOrder(o);
                          setCancelReason('');
                          setCancelErr(null);
                        }}
                        className="min-h-10 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        İptal Et
                      </button>
                    )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {ticketPreview && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/60 p-3 sm:p-4">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-2">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-white">
              <span className="text-sm font-semibold">PDF Bilet — {ticketPreview.orderNo}</span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/api/public/orders/${encodeURIComponent(ticketPreview.id)}/ticket`}
                  download={`bilet-${ticketPreview.orderNo}.pdf`}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  İndir
                </a>
                <button
                  type="button"
                  onClick={() => setTicketPreview(null)}
                  className="rounded-lg border border-white/40 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Kapat
                </button>
              </div>
            </div>
            <TicketPdfPreview apiUrl={`/api/public/orders/${encodeURIComponent(ticketPreview.id)}/ticket`} />
          </div>
        </div>
      )}

      {cancelOrder && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Kapat"
            onClick={() => !cancelLoading && setCancelOrder(null)}
          />
          <div className="relative z-[81] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-zinc-900">İptal talebi</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sipariş <span className="font-mono">{cancelOrder.orderNo}</span> için iptal nedeninizi yazın. Talep yönetici onayından sonra işlenir.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="İptal nedeniniz…"
              className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
            {cancelErr && <p className="mt-2 text-sm text-red-600">{cancelErr}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelOrder(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => void submitCancel()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {cancelLoading ? 'Gönderiliyor…' : 'Talebi gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter socialMedia={socialMedia} footerManagement={footerManagement} />
    </div>
  );
}
