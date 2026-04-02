'use client';

import { Eye, Pencil, Receipt, Send, Ticket, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';
import { TicketPdfPreview } from '@/components/site/ticket-pdf-preview';
import { isOrderTicketEligible } from '@/lib/order-ticket-eligibility';
import type { Order } from '@/types/order';

type OrdersResponse = {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const PAGE_SIZE = 25;

function fmt(v: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v || 0);
}

function paymentPlanLabel(plan?: Order['paymentPlan']) {
  return plan === 'full' ? 'Tam Ödemeli' : 'Ön Ödemeli';
}

export function OrdersPageClient({ mode = 'order' }: { mode?: 'order' | 'ask_sell' }) {
  const [q, setQ] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const dq = useDebounced(q, 300);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewing, setViewing] = useState<Order | null>(null);
  const [ticketPreview, setTicketPreview] = useState<Order | null>(null);
  const [sendingTicketEmail, setSendingTicketEmail] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [invoiceing, setInvoiceing] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => setPage(1), [dq, paymentType, status, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dq) params.set('q', dq);
    if (paymentType) params.set('paymentType', paymentType);
    params.set('kind', mode);
    if (status) params.set('status', status);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as OrdersResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Siparişler alınamadı');
      setRows(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [dq, paymentType, status, sort, page, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  const editingForm = useMemo(
    () =>
      editing
        ? {
            fullName: editing.fullName,
            countryCode: editing.countryCode ?? '+90',
            phone: editing.phone,
            email: editing.email ?? '',
            tourName: editing.tourName ?? '',
            location: editing.location ?? '',
            departurePlace: editing.departurePlace ?? '',
            date: editing.date ?? '',
            tripInfo: editing.tripInfo ?? '',
            peopleCount: editing.peopleCount,
            passengers: (editing.passengers ?? []).slice(),
            transferPaid: editing.paymentType === 'transfer' ? Boolean(editing.transferPaid) : undefined,
          }
        : null,
    [editing],
  );
  const [draft, setDraft] = useState<{
    fullName: string;
    countryCode: string;
    phone: string;
    email: string;
    tourName: string;
    location: string;
    departurePlace: string;
    date: string;
    tripInfo: string;
    peopleCount: number;
    passengers: {
      firstName: string;
      lastName: string;
      fullName: string;
      birthDate: string;
      tcNo?: string;
      isForeignCitizen: boolean;
      gender: 'female' | 'male';
    }[];
    transferPaid?: boolean;
  } | null>(null);
  useEffect(() => setDraft(editingForm), [editingForm]);

  async function saveEdit() {
    if (!editing || !draft) return;
    const payload: Record<string, unknown> = { ...draft };
    if (editing.paymentType !== 'transfer') delete payload.transferPaid;
    const res = await fetch(`/api/admin/orders/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert('Güncelleme başarısız');
      return;
    }
    setEditing(null);
    setDraft(null);
    void load();
  }

  async function uploadInvoice(file: File) {
    if (!invoiceing) return;
    const fd = new FormData();
    fd.set('file', file);
    const res = await fetch(`/api/admin/orders/${invoiceing.id}/invoice`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (!res.ok) {
      alert('PDF yükleme başarısız');
      return;
    }
    setInvoiceing(null);
    void load();
  }

  async function sendTicketEmail() {
    if (!ticketPreview) return;
    setSendingTicketEmail(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(ticketPreview.id)}/send-ticket-email`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        alert(data.error ?? 'E-posta gönderilemedi');
        return;
      }
      alert('Bilet e-postası gönderildi.');
    } catch {
      alert('İstek başarısız');
    } finally {
      setSendingTicketEmail(false);
    }
  }

  async function cancelOrder() {
    if (!cancelling) return;
    const amount = refundType === 'full' ? cancelling.totalAmount : Math.max(0, Number(refundAmount) || 0);
    const res = await fetch(`/api/admin/orders/${cancelling.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: 'cancelled',
        cancelReason,
        refundType,
        refundAmount: amount,
      }),
    });
    if (!res.ok) {
      alert('İptal başarısız');
      return;
    }
    setCancelling(null);
    setCancelReason('');
    setRefundType('full');
    setRefundAmount('');
    void load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {mode === 'ask_sell' ? 'Sor-Sat Talepleri' : 'Siparişler'}
      </h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sipariş no, ad, telefon, tur"
            className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Ödeme tipi: Tümü</option>
            {mode === 'ask_sell' ? (
              <option value="ask_sell">Sor Sat</option>
            ) : (
              <>
                <option value="transfer">Havale</option>
                <option value="credit_card">Kredi Kartı</option>
              </>
            )}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Durum: Tümü</option>
            <option value="new">Yeni</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
            className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="newest">Sıralama: Yeni → Eski</option>
            <option value="oldest">Sıralama: Eski → Yeni</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-4 py-3 font-semibold">Tarih/Saat</th>
                <th className="px-4 py-3 font-semibold">Sipariş No</th>
                <th className="px-4 py-3 font-semibold">Ad-Soyad</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">Tur Adı</th>
                <th className="px-4 py-3 font-semibold">Kişi</th>
                <th className="px-4 py-3 font-semibold">Ödeme</th>
                <th className="px-4 py-3 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  className={`border-b border-zinc-100 align-top dark:border-zinc-800/60 ${
                    o.status === 'new'
                      ? 'bg-emerald-900/25'
                      : o.status === 'cancelled'
                        ? 'bg-red-950/30'
                        : ''
                  }`}
                >
                  <td className="px-4 py-3 text-zinc-100">{new Date(o.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-100">
                    {o.status === 'new' && (
                      <span className="mr-2 inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                        YENİ
                      </span>
                    )}
                    {o.status === 'cancelled' && (
                      <span className="mr-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                        İPTAL
                      </span>
                    )}
                    {o.orderNo}
                  </td>
                  <td className="px-4 py-3 text-zinc-100">{o.fullName}</td>
                  <td className="px-4 py-3 text-zinc-100">{o.phone}</td>
                  <td className="px-4 py-3 text-zinc-100">{o.tourName}</td>
                  <td className="px-4 py-3 text-zinc-100">{o.peopleCount}</td>
                  <td className="px-4 py-3 text-zinc-100">
                    <div className="space-y-0.5">
                      <p>
                        {o.paymentType === 'transfer'
                          ? 'Havale'
                          : o.paymentType === 'credit_card'
                            ? 'Kredi Kartı'
                            : 'Sor Sat'}
                      </p>
                      <p className="text-xs text-zinc-300">{paymentPlanLabel(o.paymentPlan)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => setViewing(o)} className="rounded p-2 hover:bg-zinc-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditing(o)} className="rounded p-2 hover:bg-zinc-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={isOrderTicketEligible(o) ? 'PDF bilet' : 'Bilet: ödeme bekleniyor veya uygun değil'}
                        onClick={() => {
                          if (!isOrderTicketEligible(o)) {
                            alert(
                              'Bu sipariş için PDF bilet henüz yok. Havale siparişlerinde ödeme «Ödeme alındı» yapıldıktan sonra bilet oluşur.',
                            );
                            return;
                          }
                          setTicketPreview(o);
                        }}
                        className={`rounded p-2 hover:bg-zinc-100 ${!isOrderTicketEligible(o) ? 'opacity-40' : ''}`}
                      >
                        <Ticket className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceing(o)}
                        className={`rounded p-2 hover:bg-zinc-100 ${o.invoicePdfUrl ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setCancelling(o)} className="rounded p-2 text-red-600 hover:bg-zinc-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">{loading ? 'Yükleniyor...' : `${from}-${to} / ${total} kayıt`}</p>
        <div className="inline-flex items-center gap-2">
          <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50">
            Önceki
          </button>
          <span className="text-sm text-zinc-600">
            {page}/{Math.max(1, totalPages)}
          </span>
          <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50">
            Sonraki
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {viewing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto my-8 w-full max-w-lg rounded-xl bg-white p-4 text-zinc-900 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Sipariş Detayı</h3>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-2 text-sm font-semibold text-zinc-900">Kişisel Bilgiler</p>
                <p className="text-sm text-zinc-800">Sipariş Tarihi: {new Date(viewing.createdAt).toLocaleString('tr-TR')}</p>
                <p className="text-sm text-zinc-800">Telefon: {viewing.countryCode || ''} {viewing.phone}</p>
                <p className="text-sm text-zinc-800">E-posta: {viewing.email || '-'}</p>
                <div className="mt-2 space-y-2">
                  {(viewing.passengers ?? []).length ? (
                    (viewing.passengers ?? []).map((p, i) => (
                      <div key={`${p.fullName}-${i}`} className="rounded border border-zinc-200 bg-white p-2">
                        <p className="text-sm font-semibold text-zinc-900">Kişi {i + 1}</p>
                        <p className="text-sm text-zinc-800">Ad Soyad: {p.fullName}</p>
                        <p className="text-sm text-zinc-800">Doğum Tarihi: {p.birthDate || '-'}</p>
                        <p className="text-sm text-zinc-800">Cinsiyet: {p.gender === 'female' ? 'Kadın' : 'Erkek'}</p>
                        <p className="text-sm text-zinc-800">
                          T.C. Kimlik No: {p.isForeignCitizen ? 'T.C. vatandaşı değil' : p.tcNo || '-'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-800">Yolcu detayları bulunamadı.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-2 text-sm font-semibold text-zinc-900">Aktivite Detayları</p>
                <p className="text-sm text-zinc-800">Sipariş No: {viewing.orderNo}</p>
                <p className="text-sm text-zinc-800">Aktivite Adı: {viewing.tourName}</p>
                <p className="text-sm text-zinc-800">Lokasyon: {viewing.location || '-'}</p>
                <p className="text-sm text-zinc-800">Kalkış Yeri: {viewing.departurePlace || '-'}</p>
                <p className="text-sm text-zinc-800">Sefer: {viewing.tripInfo || '-'}</p>
                <p className="text-sm text-zinc-800">Tarih: {viewing.date || '-'}</p>
                <p className="text-sm text-zinc-800">Kişi Sayısı: {viewing.peopleCount}</p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-2 text-sm font-semibold text-zinc-900">Ödeme Bilgileri</p>
                {(() => {
                  const gross =
                    typeof viewing.grossTotalAmount === 'number' && viewing.grossTotalAmount > 0
                      ? viewing.grossTotalAmount
                      : viewing.totalAmount;
                  const remaining = Math.max(0, gross - viewing.totalAmount);
                  return (
                    <>
                <p className="text-sm text-zinc-800">Birim Fiyat: {fmt(viewing.unitPrice ?? 0)} TRY</p>
                <p className="text-sm text-zinc-800">Ödeme Planı: {paymentPlanLabel(viewing.paymentPlan)}</p>
                <p className="text-sm text-zinc-800">Toplam Tutar: {fmt(gross)} TRY</p>
                <p className="text-sm text-zinc-800">Toplam Ödeme Tutarı: {fmt(viewing.totalAmount)} TRY</p>
                <p className="text-sm text-zinc-800">Kalan Ödeme: {fmt(remaining)} TRY</p>
                <p className="text-sm text-zinc-800">
                  Ödeme Yöntemi:{' '}
                  {viewing.paymentType === 'transfer'
                    ? 'Havale'
                    : viewing.paymentType === 'credit_card'
                      ? 'Kredi Kartı'
                      : 'Sor Sat'}
                </p>
                <p className="text-sm text-zinc-800">
                  {viewing.paymentType === 'transfer'
                    ? `Havale Ödeme Durumu: ${viewing.transferPaid ? 'Ödeme alındı' : 'Ödeme bekleniyor'}`
                    : viewing.paymentType === 'credit_card'
                      ? 'Kredi kartı ile ödeme'
                      : 'Sor Sat talebi'}
                </p>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && draft && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto max-h-[90vh] max-w-3xl overflow-y-auto rounded-xl bg-white p-4 text-zinc-900 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Sipariş Düzenle</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Ad Soyad" />
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <input value={draft.countryCode} onChange={(e) => setDraft({ ...draft, countryCode: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" />
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Telefon" />
              </div>
              <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" placeholder="E-posta" />
              <input value={draft.tourName} onChange={(e) => setDraft({ ...draft, tourName: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Aktivite Adı" />
              <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Lokasyon" />
              <input value={draft.departurePlace} onChange={(e) => setDraft({ ...draft, departurePlace: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Kalkış Yeri" />
              <input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Tarih (YYYY-MM-DD)" />
              <input value={draft.tripInfo} onChange={(e) => setDraft({ ...draft, tripInfo: e.target.value })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Sefer Bilgisi" />
              <input type="number" min={1} value={draft.peopleCount} onChange={(e) => setDraft({ ...draft, peopleCount: Math.max(1, Number(e.target.value || 1)) })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-zinc-900">Yolcular</p>
              {draft.passengers.map((p, i) => (
                <div key={`${p.fullName}-${i}`} className="grid gap-2 rounded-lg border border-zinc-200 p-2 sm:grid-cols-2">
                  <input value={p.firstName} onChange={(e) => setDraft({ ...draft, passengers: draft.passengers.map((x, idx) => (idx === i ? { ...x, firstName: e.target.value, fullName: `${e.target.value} ${x.lastName}`.trim() } : x)) })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder={`Kişi ${i + 1} Ad`} />
                  <input value={p.lastName} onChange={(e) => setDraft({ ...draft, passengers: draft.passengers.map((x, idx) => (idx === i ? { ...x, lastName: e.target.value, fullName: `${x.firstName} ${e.target.value}`.trim() } : x)) })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder={`Kişi ${i + 1} Soyad`} />
                  <input value={p.birthDate} onChange={(e) => setDraft({ ...draft, passengers: draft.passengers.map((x, idx) => (idx === i ? { ...x, birthDate: e.target.value } : x)) })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="Doğum Tarihi (YYYY-MM-DD)" />
                  <input value={p.tcNo ?? ''} onChange={(e) => setDraft({ ...draft, passengers: draft.passengers.map((x, idx) => (idx === i ? { ...x, tcNo: e.target.value } : x)) })} className="min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="T.C. Kimlik No" />
                </div>
              ))}
            </div>
            {editing.paymentType === 'transfer' && typeof draft.transferPaid === 'boolean' && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Havale ödeme durumu</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Ödeme hesaba geçtiyse durumu güncelleyin.</p>
                <select
                  value={draft.transferPaid ? 'paid' : 'pending'}
                  onChange={(e) => setDraft({ ...draft, transferPaid: e.target.value === 'paid' })}
                  className="mt-2 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="pending">Ödeme bekleniyor</option>
                  <option value="paid">Ödeme alındı</option>
                </select>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">İptal</button>
              <button type="button" onClick={() => void saveEdit()} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {ticketPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 sm:p-4">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-2">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-white">
              <span className="text-sm font-semibold">PDF Bilet — {ticketPreview.orderNo}</span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/api/admin/orders/${encodeURIComponent(ticketPreview.id)}/ticket`}
                  download={`bilet-${ticketPreview.orderNo}.pdf`}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  İndir
                </a>
                <button
                  type="button"
                  disabled={sendingTicketEmail}
                  onClick={() => void sendTicketEmail()}
                  title={ticketPreview.email ? `Gönder: ${ticketPreview.email}` : 'Siparişte e-posta yok'}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/50 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  {sendingTicketEmail ? 'Gönderiliyor…' : 'Gönder'}
                </button>
                <button
                  type="button"
                  onClick={() => setTicketPreview(null)}
                  className="rounded-lg border border-white/40 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Kapat
                </button>
              </div>
            </div>
            <TicketPdfPreview apiUrl={`/api/admin/orders/${encodeURIComponent(ticketPreview.id)}/ticket`} />
          </div>
        </div>
      )}

      {invoiceing && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto max-w-lg rounded-xl bg-white p-4 text-zinc-900 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Fatura PDF Yükle</h3>
            <input
              type="file"
              accept="application/pdf"
              className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void uploadInvoice(file);
                e.currentTarget.value = '';
              }}
            />
            {invoiceing.invoicePdfUrl && (
              <a href={invoiceing.invoicePdfUrl} target="_blank" className="mt-3 inline-block text-sm text-blue-600" rel="noreferrer">
                Yüklü PDF'yi aç
              </a>
            )}
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setInvoiceing(null)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {cancelling && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto max-w-lg rounded-xl bg-white p-4 text-zinc-900 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Sipariş İptali</h3>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="İptal gerekçesi"
              className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" checked={refundType === 'full'} onChange={() => setRefundType('full')} />
                Tam iade
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" checked={refundType === 'partial'} onChange={() => setRefundType('partial')} />
                Kısmi iade
              </label>
            </div>
            <input
              type="number"
              disabled={refundType === 'full'}
              value={refundType === 'full' ? cancelling.totalAmount : refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCancelling(null)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">Vazgeç</button>
              <button type="button" onClick={() => void cancelOrder()} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">İptal Onayla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

