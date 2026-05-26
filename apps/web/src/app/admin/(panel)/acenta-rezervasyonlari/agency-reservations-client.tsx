'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  CalendarRange,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import { useDebounced } from '@/hooks/use-debounced';
import type {
  AgencyVillaReservation,
  AgencyVillaReservationStatus,
} from '@/types/admin-agency-villa-reservation';
import type { AdminVilla } from '@/types/admin-villa';

type FormState = {
  villaId: string;
  agencyName: string;
  checkIn: string;
  checkOut: string;
  fullName: string;
  guestCount: string;
  phone: string;
  tcKimlikNo: string;
  email: string;
  advancePayment: string;
  cleaningFee: string;
  totalAmount: string;
  heatingFee: string;
  damageDeposit: string;
  note: string;
  status: AgencyVillaReservationStatus;
};

const EMPTY_FORM: FormState = {
  villaId: '',
  agencyName: '',
  checkIn: '',
  checkOut: '',
  fullName: '',
  guestCount: '',
  phone: '',
  tcKimlikNo: '',
  email: '',
  advancePayment: '',
  cleaningFee: '',
  totalAmount: '',
  heatingFee: '',
  damageDeposit: '',
  note: '',
  status: 'active',
};

const STATUS_OPTIONS: { value: AgencyVillaReservationStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'passive', label: 'Pasif' },
  { value: 'cancelled', label: 'İptal' },
];

function statusBadge(status: AgencyVillaReservationStatus) {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800';
  }
  if (status === 'passive') {
    return 'bg-amber-100 text-amber-900 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800';
  }
  return 'bg-zinc-200 text-zinc-700 ring-zinc-300/80 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700';
}

function statusLabel(status: AgencyVillaReservationStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function formatTry(n: number) {
  if (!n) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n) + ' ₺';
}

function formatDateTr(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function reservationToForm(r: AgencyVillaReservation): FormState {
  return {
    villaId: r.villaId,
    agencyName: r.agencyName,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    fullName: r.fullName,
    guestCount: r.guestCount ? String(r.guestCount) : '',
    phone: r.phone,
    tcKimlikNo: r.tcKimlikNo,
    email: r.email,
    advancePayment: r.advancePayment ? String(r.advancePayment) : '',
    cleaningFee: r.cleaningFee ? String(r.cleaningFee) : '',
    totalAmount: r.totalAmount ? String(r.totalAmount) : '',
    heatingFee: r.heatingFee ? String(r.heatingFee) : '',
    damageDeposit: r.damageDeposit ? String(r.damageDeposit) : '',
    note: r.note,
    status: r.status,
  };
}

function formToPayload(form: FormState) {
  return {
    villaId: form.villaId,
    agencyName: form.agencyName,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    fullName: form.fullName,
    guestCount: form.guestCount === '' ? 0 : Number(form.guestCount),
    phone: form.phone,
    tcKimlikNo: form.tcKimlikNo,
    email: form.email,
    advancePayment: form.advancePayment === '' ? 0 : Number(form.advancePayment),
    cleaningFee: form.cleaningFee === '' ? 0 : Number(form.cleaningFee),
    totalAmount: form.totalAmount === '' ? 0 : Number(form.totalAmount),
    heatingFee: form.heatingFee === '' ? 0 : Number(form.heatingFee),
    damageDeposit: form.damageDeposit === '' ? 0 : Number(form.damageDeposit),
    note: form.note,
    status: form.status,
  };
}

const inputClass =
  'mt-1 min-h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50';

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400';

export function AgencyReservationsClient() {
  const [villas, setVillas] = useState<AdminVilla[]>([]);
  const [rows, setRows] = useState<AgencyVillaReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filterVillaId, setFilterVillaId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const dq = useDebounced(q, 300);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const villaById = useMemo(() => new Map(villas.map((v) => [v.id, v])), [villas]);

  const loadVillas = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/villas?pageSize=100', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = (await res.json()) as { villas?: AdminVilla[] };
      setVillas(Array.isArray(data.villas) ? data.villas : []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dq) params.set('q', dq);
    if (filterVillaId) params.set('villaId', filterVillaId);
    if (filterStatus) params.set('status', filterStatus);
    try {
      const res = await fetch(`/api/admin/agency-villa-reservations?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as { error?: string; reservations?: AgencyVillaReservation[] };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setRows(Array.isArray(data.reservations) ? data.reservations : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [dq, filterVillaId, filterStatus]);

  useEffect(() => {
    void loadVillas();
  }, [loadVillas]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active').length;
    const passive = rows.filter((r) => r.status === 'passive').length;
    const cancelled = rows.filter((r) => r.status === 'cancelled').length;
    return { total: rows.length, active, passive, cancelled };
  }, [rows]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: AgencyVillaReservation) {
    setEditingId(row.id);
    setForm(reservationToForm(row));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.villaId || !form.checkIn || !form.checkOut) {
      alert('Villa seçimi, giriş ve çıkış tarihi zorunludur.');
      return;
    }
    if (form.checkOut <= form.checkIn) {
      alert('Çıkış tarihi girişten sonra olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/agency-villa-reservations/${encodeURIComponent(editingId)}`
        : '/api/admin/agency-villa-reservations';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formToPayload(form)),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? 'Kaydedilemedi');
        return;
      }
      closeModal();
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: AgencyVillaReservation) {
    const villaName = villaById.get(row.villaId)?.displayName ?? 'Villa';
    if (!confirm(`${villaName} — ${formatDateTr(row.checkIn)} / ${formatDateTr(row.checkOut)} kaydını silmek istiyor musunuz?`)) {
      return;
    }
    const res = await fetch(`/api/admin/agency-villa-reservations/${encodeURIComponent(row.id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Silinemedi');
      return;
    }
    void load();
  }

  const modalNights = nightsBetween(form.checkIn, form.checkOut);

  const modal = modalOpen ? (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-zinc-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        className="flex max-h-[min(94vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:rounded-3xl dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agency-res-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-white px-5 py-4 dark:border-zinc-800 dark:from-amber-950/30 dark:to-zinc-900 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                {editingId ? 'Rezervasyon düzenle' : 'Yeni acenta rezervasyonu'}
              </p>
              <h2 id="agency-res-modal-title" className="mt-0.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {editingId ? 'Kaydı güncelle' : 'Rezervasyon gir'}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                <Building2 className="h-4 w-4" aria-hidden />
                Villa ve tarih
                <span className="text-xs font-normal text-amber-800/80 dark:text-amber-400/80">(zorunlu)</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={labelClass}>Villa seçimi *</span>
                  <select
                    className={inputClass}
                    value={form.villaId}
                    onChange={(e) => updateForm('villaId', e.target.value)}
                    required
                  >
                    <option value="">Villa seçin…</option>
                    {villas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName}
                        {!v.isActive ? ' (pasif)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Giriş tarihi *</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.checkIn}
                    onChange={(e) => updateForm('checkIn', e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span className={labelClass}>Çıkış tarihi *</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.checkOut}
                    min={form.checkIn || undefined}
                    onChange={(e) => updateForm('checkOut', e.target.value)}
                    required
                  />
                </label>
                {modalNights > 0 && (
                  <p className="sm:col-span-2 text-sm text-amber-900 dark:text-amber-300">
                    <CalendarRange className="mr-1 inline h-4 w-4 align-text-bottom" aria-hidden />
                    {modalNights} gece konaklama
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                <UserRound className="h-4 w-4" aria-hidden />
                Acenta ve misafir
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={labelClass}>Acenta adı</span>
                  <input className={inputClass} value={form.agencyName} onChange={(e) => updateForm('agencyName', e.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>Ad soyad</span>
                  <input className={inputClass} value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>Kişi sayısı</span>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.guestCount}
                    onChange={(e) => updateForm('guestCount', e.target.value)}
                  />
                </label>
                <label>
                  <span className={labelClass}>Telefon</span>
                  <input className={inputClass} value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>TC kimlik no</span>
                  <input className={inputClass} value={form.tcKimlikNo} onChange={(e) => updateForm('tcKimlikNo', e.target.value)} />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass}>E-posta</span>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                <CircleDollarSign className="h-4 w-4" aria-hidden />
                Ücretler (TRY)
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ['advancePayment', 'Ön ödeme'],
                    ['cleaningFee', 'Temizlik ücreti'],
                    ['totalAmount', 'Toplam tutar'],
                    ['heatingFee', 'Isıtma ücreti'],
                    ['damageDeposit', 'Hasar depozitosu'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    <span className={labelClass}>{label}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputClass}
                      value={form[key]}
                      onChange={(e) => updateForm(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>Not</span>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.note}
                  onChange={(e) => updateForm('note', e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>Durum</span>
                <select className={inputClass} value={form.status} onChange={(e) => updateForm('status', e.target.value as AgencyVillaReservationStatus)}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 sm:flex-row sm:justify-end dark:border-zinc-800 dark:bg-zinc-950/60 sm:px-6">
          <button
            type="button"
            onClick={closeModal}
            className="min-h-11 rounded-xl border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-white dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="min-h-11 rounded-xl bg-amber-700 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-amber-800 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Rezervasyonu kaydet'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Acenta Rezervasyonları</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Acenta üzerinden gelen villa rezervasyonlarını villa ve tarih aralığı ile kaydedin. Diğer alanlar isteğe bağlıdır.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Yeni rezervasyon
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Toplam', value: stats.total, tone: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900' },
          { label: 'Aktif', value: stats.active, tone: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30' },
          { label: 'Pasif', value: stats.passive, tone: 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30' },
          { label: 'İptal', value: stats.cancelled, tone: 'border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="sr-only">Ara</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                className="min-h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                placeholder="Acenta, misafir, telefon, not…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-500">Villa</span>
            <select
              className="min-h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              value={filterVillaId}
              onChange={(e) => setFilterVillaId(e.target.value)}
            >
              <option value="">Tümü</option>
              {villas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-500">Durum</span>
            <select
              className="min-h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tümü</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <p className="p-8 text-center text-sm text-zinc-500">Yükleniyor…</p>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Henüz rezervasyon yok</p>
            <p className="mt-1 text-sm text-zinc-500">İlk kaydı eklemek için yukarıdaki butonu kullanın.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                  <th className="px-4 py-3">Villa</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Acenta</th>
                  <th className="px-4 py-3">Misafir</th>
                  <th className="px-4 py-3">Toplam</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((row) => {
                  const villa = villaById.get(row.villaId);
                  const nights = nightsBetween(row.checkIn, row.checkOut);
                  return (
                    <tr key={row.id} className="transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{villa?.displayName ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        <p>
                          {formatDateTr(row.checkIn)} → {formatDateTr(row.checkOut)}
                        </p>
                        {nights > 0 && <p className="text-xs text-zinc-500">{nights} gece</p>}
                      </td>
                      <td className="px-4 py-3">{row.agencyName || '—'}</td>
                      <td className="px-4 py-3">
                        <p>{row.fullName || '—'}</p>
                        {(row.guestCount > 0 || row.phone) && (
                          <p className="text-xs text-zinc-500">
                            {row.guestCount > 0 ? `${row.guestCount} kişi` : ''}
                            {row.guestCount > 0 && row.phone ? ' · ' : ''}
                            {row.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">{formatTry(row.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadge(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-950/40"
                            aria-label="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(row)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                            aria-label="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mounted && modalOpen ? createPortal(modal, document.body) : null}
    </div>
  );
}
