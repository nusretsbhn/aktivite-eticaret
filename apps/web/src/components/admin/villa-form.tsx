'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { VillaEquipmentIconField } from '@/components/admin/villa-equipment-icon-picker';
import { slugifyVillaTitle } from '@/lib/villa-slug';
import type { AdminSettings } from '@/types/admin-settings';
import type {
  AdminVilla,
  AdminVillaInput,
  VillaEquipmentItem,
  VillaPaymentCurrency,
  VillaPool,
  VillaPoolType,
  VillaRoom,
} from '@/types/admin-villa';

type TabId = 'general' | 'owner' | 'location' | 'pricing' | 'pools' | 'equipment' | 'rooms' | 'extra';

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'Genel' },
  { id: 'owner', label: 'Ev Sahibi' },
  { id: 'location', label: 'Konum' },
  { id: 'pricing', label: 'Fiyat Kuralları' },
  { id: 'pools', label: 'Havuz Bilgisi' },
  { id: 'equipment', label: 'Donanım' },
  { id: 'rooms', label: 'Oda Envanteri' },
  { id: 'extra', label: 'Ek Bilgiler' },
];

const POOL_TYPE_OPTIONS: { value: VillaPoolType; label: string }[] = [
  { value: 'open', label: 'Açık havuz' },
  { value: 'indoor', label: 'Kapalı havuz' },
  { value: 'kids', label: 'Çocuk havuzu' },
  { value: 'shared', label: 'Ortak havuz' },
];

const CURRENCY_OPTIONS: { value: VillaPaymentCurrency; label: string }[] = [
  { value: 'TRY', label: 'TL' },
  { value: 'USD', label: 'Dolar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'Sterlin' },
];

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyInput(): AdminVillaInput {
  return {
    displayName: '',
    legalName: '',
    documentNo: '',
    isActive: true,
    tagIds: [],
    guestCount: 1,
    bedroomCount: 1,
    bathroomCount: 1,
    squareMeters: 0,
    slug: '',
    description: '',
    ownerFullName: '',
    ownerPhone: '',
    ownerIban: '',
    city: '',
    district: '',
    region: '',
    mapUrl: '',
    addressLine: '',
    minStayNights: 1,
    cleaningFee: 0,
    freeCleaningThreshold: 0,
    damageDeposit: 0,
    paymentCurrency: 'TRY',
    commissionPercent: 0,
    prepaymentPercent: 0,
    pools: [],
    featuredItems: [],
    amenities: [],
    houseRules: [],
    rooms: [],
    utilitiesNote: '',
    nearbyNote: '',
    sellerNote: '',
    gallery: [],
    prices: [],
    availability: [],
  };
}

function villaToInput(v: AdminVilla): AdminVillaInput {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = v;
  return {
    ...rest,
    // Eski kayıtlar (tagIds olmayan) için runtime güvenliği
    tagIds: Array.isArray((rest as any).tagIds) ? ((rest as any).tagIds as string[]) : [],
  };
}

const inputClass =
  'mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50';
const labelClass = 'block text-sm text-zinc-600 dark:text-zinc-400';

type Props = { mode: 'create' | 'edit'; villa?: AdminVilla };

export function VillaForm({ mode, villa }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('general');
  const [form, setForm] = useState<AdminVillaInput>(() =>
    mode === 'edit' && villa ? villaToInput(villa) : emptyInput(),
  );
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && villa) {
      setForm(villaToInput(villa));
    }
  }, [mode, villa]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('settings');
        const data = (await r.json()) as { settings: AdminSettings };
        if (!cancelled) setSettings(data.settings);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncSlugFromTitle = useCallback(() => {
    if (slugManual) return;
    setForm((f) => ({ ...f, slug: slugifyVillaTitle(f.displayName) }));
  }, [slugManual]);

  function update<K extends keyof AdminVillaInput>(key: K, value: AdminVillaInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTag(id: string) {
    setForm((f) => {
      const has = (f.tagIds ?? []).includes(id);
      return { ...f, tagIds: has ? (f.tagIds ?? []).filter((x) => x !== id) : [...(f.tagIds ?? []), id] };
    });
  }

  function addPool() {
    const p: VillaPool = {
      id: newId(),
      poolType: 'open',
      heated: false,
      widthCm: 0,
      lengthCm: 0,
      depthCm: 0,
      note: '',
    };
    setForm((f) => ({ ...f, pools: [...f.pools, p] }));
  }

  function updatePool(id: string, patch: Partial<VillaPool>) {
    setForm((f) => ({
      ...f,
      pools: f.pools.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }

  function removePool(id: string) {
    setForm((f) => ({ ...f, pools: f.pools.filter((x) => x.id !== id) }));
  }

  function addEquip(kind: 'featuredItems' | 'amenities' | 'houseRules') {
    const item: VillaEquipmentItem = { id: newId(), icon: '', description: '' };
    setForm((f) => ({ ...f, [kind]: [...f[kind], item] }));
  }

  function updateEquip(kind: 'featuredItems' | 'amenities' | 'houseRules', id: string, patch: Partial<VillaEquipmentItem>) {
    setForm((f) => ({
      ...f,
      [kind]: f[kind].map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }

  function removeEquip(kind: 'featuredItems' | 'amenities' | 'houseRules', id: string) {
    setForm((f) => ({ ...f, [kind]: f[kind].filter((x) => x.id !== id) }));
  }

  function addRoom() {
    const room: VillaRoom = { id: newId(), name: '', items: [] };
    setForm((f) => ({ ...f, rooms: [...f.rooms, room] }));
  }

  function updateRoomName(roomId: string, name: string) {
    setForm((f) => ({
      ...f,
      rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
    }));
  }

  function removeRoom(roomId: string) {
    setForm((f) => ({ ...f, rooms: f.rooms.filter((r) => r.id !== roomId) }));
  }

  function addRoomItem(roomId: string) {
    setForm((f) => ({
      ...f,
      rooms: f.rooms.map((r) =>
        r.id === roomId ? { ...r, items: [...r.items, { id: newId(), name: '' }] } : r,
      ),
    }));
  }

  function updateRoomItem(roomId: string, itemId: string, name: string) {
    setForm((f) => ({
      ...f,
      rooms: f.rooms.map((r) =>
        r.id === roomId
          ? { ...r, items: r.items.map((it) => (it.id === itemId ? { ...it, name } : it)) }
          : r,
      ),
    }));
  }

  function removeRoomItem(roomId: string, itemId: string) {
    setForm((f) => ({
      ...f,
      rooms: f.rooms.map((r) =>
        r.id === roomId ? { ...r, items: r.items.filter((it) => it.id !== itemId) } : r,
      ),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload = { ...form, slug: slugManual ? slugifyVillaTitle(form.slug) : slugifyVillaTitle(form.displayName) };
      const url = mode === 'create' ? '/api/admin/villas' : `/api/admin/villas/${villa!.id}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Kayıt başarısız');
        return;
      }
      router.push('/admin/villalar');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const tabProgress = useMemo(() => {
    const i = TABS.findIndex((t) => t.id === tab);
    return `${i + 1} / ${TABS.length}`;
  }, [tab]);

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Sekme {tabProgress}</p>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'general' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Villa adı (takma) *
            <input
              className={inputClass}
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              onBlur={() => syncSlugFromTitle()}
              required
            />
          </label>
          <label className={labelClass}>
            Villa gerçek adı *
            <input
              className={inputClass}
              value={form.legalName}
              onChange={(e) => update('legalName', e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            Villa belge no (opsiyonel)
            <input className={inputClass} value={form.documentNo} onChange={(e) => update('documentNo', e.target.value)} />
          </label>
          <label className={labelClass}>
            Durum *
            <select
              className={inputClass}
              value={form.isActive ? 'active' : 'passive'}
              onChange={(e) => update('isActive', e.target.value === 'active')}
            >
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </label>
          <label className={labelClass}>
            Kişi sayısı *
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.guestCount || ''}
              onChange={(e) => update('guestCount', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <label className={labelClass}>
            Yatak odası sayısı *
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.bedroomCount || ''}
              onChange={(e) => update('bedroomCount', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <label className={labelClass}>
            Banyo sayısı *
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.bathroomCount || ''}
              onChange={(e) => update('bathroomCount', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <label className={labelClass}>
            Metrekare *
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={form.squareMeters || ''}
              onChange={(e) => update('squareMeters', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={slugManual}
                onChange={(e) => {
                  setSlugManual(e.target.checked);
                  if (!e.target.checked) syncSlugFromTitle();
                }}
              />
              Slug&apos;ı elle düzenle
            </label>
            <label className={`${labelClass} mt-2`}>
              Villa URL (slug) *
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
                onBlur={() => update('slug', slugifyVillaTitle(form.slug))}
                placeholder="otomatik veya elle"
                required
              />
            </label>
          </div>
          <label className={`${labelClass} sm:col-span-2`}>
            Tanıtım yazısı *
            <textarea
              className={`${inputClass} min-h-[140px]`}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </label>
        </div>
      )}

      {tab === 'owner' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Yetkili kişi ad-soyad *
            <input
              className={inputClass}
              value={form.ownerFullName}
              onChange={(e) => update('ownerFullName', e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            Telefon *
            <input className={inputClass} value={form.ownerPhone} onChange={(e) => update('ownerPhone', e.target.value)} required />
          </label>
          <label className={labelClass}>
            IBAN (opsiyonel)
            <input className={inputClass} value={form.ownerIban} onChange={(e) => update('ownerIban', e.target.value)} />
          </label>
        </div>
      )}

      {tab === 'location' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            İl *
            <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} required />
          </label>
          <label className={labelClass}>
            İlçe *
            <input className={inputClass} value={form.district} onChange={(e) => update('district', e.target.value)} required />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Bölge *
            <input className={inputClass} value={form.region} onChange={(e) => update('region', e.target.value)} required />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Harita linki (opsiyonel)
            <input className={inputClass} value={form.mapUrl} onChange={(e) => update('mapUrl', e.target.value)} placeholder="https://..." />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Açık adres (opsiyonel)
            <textarea className={`${inputClass} min-h-[80px]`} value={form.addressLine} onChange={(e) => update('addressLine', e.target.value)} />
          </label>
        </div>
      )}

      {tab === 'pricing' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Minimum konaklama (gece) *
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.minStayNights || ''}
              onChange={(e) => update('minStayNights', Math.max(1, Number(e.target.value) || 1))}
              required
            />
          </label>
          <label className={labelClass}>
            Temizlik ücreti *
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={form.cleaningFee}
              onChange={(e) => update('cleaningFee', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <label className={labelClass}>
            Ücretsiz temizlik üst limit *
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={form.freeCleaningThreshold}
              onChange={(e) => update('freeCleaningThreshold', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <label className={labelClass}>
            Hasar depozitosu *
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={form.damageDeposit}
              onChange={(e) => update('damageDeposit', Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
          <label className={labelClass}>
            Ödeme döviz türü *
            <select
              className={inputClass}
              value={form.paymentCurrency}
              onChange={(e) => update('paymentCurrency', e.target.value as VillaPaymentCurrency)}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Komisyon oranı (%) *
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className={inputClass}
              value={form.commissionPercent}
              onChange={(e) => update('commissionPercent', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              required
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Villa ön ödeme oranı (%) *
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className={inputClass}
              value={form.prepaymentPercent}
              onChange={(e) => update('prepaymentPercent', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              required
            />
          </label>
        </div>
      )}

      {tab === 'pools' && (
        <div className="space-y-4">
          <button type="button" onClick={addPool} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Havuz ekle
          </button>
          {form.pools.length === 0 && <p className="text-sm text-zinc-500">Henüz havuz eklenmedi.</p>}
          {form.pools.map((pool) => (
            <div key={pool.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Havuz</p>
                <button
                  type="button"
                  className="text-sm text-red-600 dark:text-red-400"
                  onClick={() => removePool(pool.id)}
                >
                  Kaldır
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Havuz tipi
                  <select
                    className={inputClass}
                    value={pool.poolType}
                    onChange={(e) => updatePool(pool.id, { poolType: e.target.value as VillaPoolType })}
                  >
                    {POOL_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${labelClass} flex items-end gap-2 pb-1`}>
                  <input
                    type="checkbox"
                    checked={pool.heated}
                    onChange={(e) => updatePool(pool.id, { heated: e.target.checked })}
                  />
                  Isıtmalı
                </label>
                <label className={labelClass}>
                  En (cm)
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={pool.widthCm || ''}
                    onChange={(e) => updatePool(pool.id, { widthCm: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </label>
                <label className={labelClass}>
                  Boy (cm)
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={pool.lengthCm || ''}
                    onChange={(e) => updatePool(pool.id, { lengthCm: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </label>
                <label className={labelClass}>
                  Derinlik (cm)
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={pool.depthCm || ''}
                    onChange={(e) => updatePool(pool.id, { depthCm: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Havuz notu
                  <input
                    className={inputClass}
                    value={pool.note}
                    onChange={(e) => updatePool(pool.id, { note: e.target.value })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'equipment' && (
        <div className="space-y-8">
          {(
            [
              { key: 'featuredItems' as const, title: 'Öne çıkan özellikler' },
              { key: 'amenities' as const, title: 'Ev olanakları' },
              { key: 'houseRules' as const, title: 'Ev kuralları' },
            ] as const
          ).map((block) => (
            <div key={block.key}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{block.title}</p>
                <button
                  type="button"
                  onClick={() => addEquip(block.key)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
                >
                  Ekle
                </button>
              </div>
              <div className="space-y-2">
                {form[block.key].map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                    <VillaEquipmentIconField
                      value={item.icon}
                      onChange={(icon) => updateEquip(block.key, item.id, { icon })}
                    />
                    <input
                      className={`${inputClass} min-w-[200px] flex-1`}
                      placeholder="Açıklama"
                      value={item.description}
                      onChange={(e) => updateEquip(block.key, item.id, { description: e.target.value })}
                    />
                    <button
                      type="button"
                      className="text-sm text-red-600"
                      onClick={() => removeEquip(block.key, item.id)}
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rooms' && (
        <div className="space-y-4">
          <button type="button" onClick={addRoom} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Oda ekle
          </button>
          {form.rooms.length === 0 && <p className="text-sm text-zinc-500">Henüz oda eklenmedi.</p>}
          {form.rooms.map((room) => (
            <div key={room.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <label className={`${labelClass} flex-1 min-w-[200px]`}>
                  Oda ismi
                  <input
                    className={inputClass}
                    value={room.name}
                    onChange={(e) => updateRoomName(room.id, e.target.value)}
                  />
                </label>
                <button type="button" className="text-sm text-red-600" onClick={() => removeRoom(room.id)}>
                  Odayı sil
                </button>
              </div>
              <button
                type="button"
                onClick={() => addRoomItem(room.id)}
                className="mb-2 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
              >
                Envanter öğesi ekle
              </button>
              <div className="space-y-2">
                {room.items.map((it) => (
                  <div key={it.id} className="flex gap-2">
                    <input
                      className={inputClass}
                      placeholder="Envanter ismi"
                      value={it.name}
                      onChange={(e) => updateRoomItem(room.id, it.id, e.target.value)}
                    />
                    <button type="button" className="text-sm text-red-600" onClick={() => removeRoomItem(room.id, it.id)}>
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'extra' && (
        <div className="grid gap-4">
          <fieldset className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <legend className="px-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">Etiketler</legend>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">Ayarlar → Etiket’ten tanımlanan etiketler.</p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {(settings?.tags ?? []).map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={(form.tagIds ?? []).includes(t.id)} onChange={() => toggleTag(t.id)} />
                  {t.name}
                </label>
              ))}

              {(!settings?.tags || settings.tags.length === 0) && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Ayarlar → Etiket’ten etiket ekleyin.</p>
              )}
            </div>
          </fieldset>

          <label className={labelClass}>
            Su / elektrik bilgisi
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={form.utilitiesNote}
              onChange={(e) => update('utilitiesNote', e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Yakında neler var
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={form.nearbyNote}
              onChange={(e) => update('nearbyNote', e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Satıcı notu
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={form.sellerNote}
              onChange={(e) => update('sellerNote', e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? 'Kaydediliyor…' : mode === 'create' ? 'Villayı kaydet' : 'Değişiklikleri kaydet'}
        </button>
        <Link
          href="/admin/villalar"
          className="inline-flex items-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium dark:border-zinc-600"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
