'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  computeDiscountedFromAdult,
  computeRuleAdultPrice,
  computeRuleSinglePrice,
} from '@/lib/package-tour-pricing';
import type { AdminPackageTour, PackageTourPriceRule } from '@/types/admin-package-tour';
import type { AdminPackageTourActivity } from '@/types/admin-package-tour-activity';

type Props = { packageTour: AdminPackageTour };

export function PackageTourPricesClient({ packageTour }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<PackageTourPriceRule[]>(() => [...packageTour.priceRules]);
  const [activities, setActivities] = useState<AdminPackageTourActivity[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [profitPercent, setProfitPercent] = useState('');
  const [singleRoomMultiplier, setSingleRoomMultiplier] = useState('1');
  const [roundingMode, setRoundingMode] = useState<'up' | 'down'>('up');
  const [childAgeRules, setChildAgeRules] = useState<
    { id: string; childOrder: string; minAge: string; maxAge: string; discountPercent: string }[]
  >([
    { id: crypto.randomUUID(), childOrder: '1', minAge: '0', maxAge: '10', discountPercent: '100' },
    { id: crypto.randomUUID(), childOrder: '2', minAge: '0', maxAge: '2', discountPercent: '100' },
    { id: crypto.randomUUID(), childOrder: '2', minAge: '3', maxAge: '12', discountPercent: '50' },
  ]);

  useEffect(() => {
    void fetch('/api/admin/package-tour-activities', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ activities: AdminPackageTourActivity[] }>) : null))
      .then((d) => setActivities(Array.isArray(d?.activities) ? d.activities : []))
      .catch(() => setActivities([]));
  }, []);

  function getIncludedActivityTotalByDate(date: string): number {
    const included = new Set(packageTour.activityIds);
    return activities
      .filter((a) => included.has(a.id) || included.has(a.activityId))
      .reduce((sum, a) => {
        const row = (a.prices ?? []).find((p) => p.date === date);
        return sum + Math.max(0, Number(row?.price) || 0);
      }, 0);
  }

  const preview = useMemo(() => {
    const rule = {
      costPrice: Math.max(0, Number(costPrice) || 0),
      profitPercent: Math.max(0, Number(profitPercent) || 0),
      singleRoomMultiplier: Math.max(1, Number(singleRoomMultiplier) || 1),
      roundingMode,
      childAgeRules: childAgeRules
        .map((r) => ({
          id: r.id,
          childOrder: Math.max(1, Number(r.childOrder) || 1),
          minAge: Math.max(0, Number(r.minAge) || 0),
          maxAge: Math.max(0, Number(r.maxAge) || 0),
          discountPercent: Math.min(100, Math.max(0, Number(r.discountPercent) || 0)),
        }))
        .map((r) => ({ ...r, maxAge: Math.max(r.minAge, r.maxAge) })),
    };
    const activityTotal = getIncludedActivityTotalByDate(fromDate);
    const adult = computeRuleAdultPrice({ ...rule, nights: packageTour.nightCount, activityTotal });
    const single = computeRuleSinglePrice({ ...rule, nights: packageTour.nightCount, activityTotal });
    const childPrices = rule.childAgeRules.map((r) => ({
      ...r,
      price: computeDiscountedFromAdult(adult, r.discountPercent),
    }));
    return { adult, single, childPrices };
  }, [costPrice, profitPercent, singleRoomMultiplier, roundingMode, childAgeRules, fromDate, packageTour.nightCount, activities]);

  async function persist(next: PackageTourPriceRule[]) {
    setSaving(true);
    const res = await fetch(`/api/admin/package-tours/${packageTour.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ priceRules: next }),
    });
    setSaving(false);
    if (!res.ok) {
      alert('Kaydedilemedi');
      return;
    }
    setRows(next);
    router.refresh();
  }

  async function addRule() {
    if (!fromDate || !toDate) return;
    const rule: PackageTourPriceRule = {
      id: editingRuleId ?? crypto.randomUUID(),
      fromDate,
      toDate,
      costPrice: Math.max(0, Number(costPrice) || 0),
      profitPercent: Math.max(0, Number(profitPercent) || 0),
      singleRoomMultiplier: Math.max(1, Number(singleRoomMultiplier) || 1),
      roundingMode,
      childAgeRules: childAgeRules
        .map((r) => ({
          id: r.id,
          childOrder: Math.max(1, Number(r.childOrder) || 1),
          minAge: Math.max(0, Number(r.minAge) || 0),
          maxAge: Math.max(0, Number(r.maxAge) || 0),
          discountPercent: Math.min(100, Math.max(0, Number(r.discountPercent) || 0)),
        }))
        .map((r) => ({ ...r, maxAge: Math.max(r.minAge, r.maxAge) })),
    };
    const next = editingRuleId ? rows.map((r) => (r.id === editingRuleId ? rule : r)) : [rule, ...rows];
    await persist(next);
    setEditingRuleId(null);
  }

  async function removeRule(id: string) {
    await persist(rows.filter((x) => x.id !== id));
  }

  function addChildRuleRow() {
    setChildAgeRules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), childOrder: '1', minAge: '0', maxAge: '0', discountPercent: '0' },
    ]);
  }

  function removeChildRuleRow(id: string) {
    setChildAgeRules((prev) => prev.filter((r) => r.id !== id));
  }

  function updateChildRuleRow(
    id: string,
    key: 'childOrder' | 'minAge' | 'maxAge' | 'discountPercent',
    value: string,
  ) {
    setChildAgeRules((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  function startEdit(rule: PackageTourPriceRule) {
    setEditingRuleId(rule.id);
    setFromDate(rule.fromDate);
    setToDate(rule.toDate);
    setCostPrice(String(rule.costPrice));
    setProfitPercent(String(rule.profitPercent));
    setSingleRoomMultiplier(String(rule.singleRoomMultiplier));
    setRoundingMode(rule.roundingMode);
    setChildAgeRules(
      rule.childAgeRules.map((r) => ({
        id: r.id,
        childOrder: String(r.childOrder),
        minAge: String(r.minAge),
        maxAge: String(r.maxAge),
        discountPercent: String(r.discountPercent),
      })),
    );
  }

  function cancelEdit() {
    setEditingRuleId(null);
    setFromDate('');
    setToDate('');
    setCostPrice('');
    setProfitPercent('');
    setSingleRoomMultiplier('1');
    setRoundingMode('up');
    setChildAgeRules([
      { id: crypto.randomUUID(), childOrder: '1', minAge: '0', maxAge: '10', discountPercent: '100' },
      { id: crypto.randomUUID(), childOrder: '2', minAge: '0', maxAge: '2', discountPercent: '100' },
      { id: crypto.randomUUID(), childOrder: '2', minAge: '3', maxAge: '12', discountPercent: '50' },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/paket-turlar" className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          ← Paket turlara dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Paket Tur Fiyat Takvimi</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{packageTour.packageName}</p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Tarih aralığına fiyat ekle</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="date" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <input type="number" min={0} step={0.01} placeholder="Günlük otel maliyeti" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          <input type="number" min={0} step={0.01} placeholder="Kar oranı %" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} />
          <input type="number" min={1} step={0.01} placeholder="Single oda çarpanı" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={singleRoomMultiplier} onChange={(e) => setSingleRoomMultiplier(e.target.value)} />
          <select className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={roundingMode} onChange={(e) => setRoundingMode(e.target.value === 'down' ? 'down' : 'up')}>
            <option value="up">Yukarı yuvarla (500)</option>
            <option value="down">Aşağı yuvarla (500)</option>
          </select>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Çocuk yaş/indirim kuralları</p>
            <button
              type="button"
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
              onClick={addChildRuleRow}
            >
              Satır ekle
            </button>
          </div>
          <div className="space-y-2">
            {childAgeRules.map((r) => (
              <div key={r.id} className="grid gap-2 sm:grid-cols-5">
                <input
                  type="number"
                  min={1}
                  placeholder="Kaçıncı çocuk"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={r.childOrder}
                  onChange={(e) => updateChildRuleRow(r.id, 'childOrder', e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Min yaş"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={r.minAge}
                  onChange={(e) => updateChildRuleRow(r.id, 'minAge', e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max yaş"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={r.maxAge}
                  onChange={(e) => updateChildRuleRow(r.id, 'maxAge', e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="İndirim %"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={r.discountPercent}
                  onChange={(e) => updateChildRuleRow(r.id, 'discountPercent', e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
                  onClick={() => removeChildRuleRow(r.id)}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700">
          <p>Yetişkin fiyatı: <strong>{preview.adult.toLocaleString('tr-TR')} TL</strong></p>
          <p>Single oda: <strong>{preview.single.toLocaleString('tr-TR')} TL</strong></p>
          <p>Dahil aktiviteler toplamı: <strong>{getIncludedActivityTotalByDate(fromDate).toLocaleString('tr-TR')} TL</strong></p>
          {preview.childPrices.map((r) => (
            <p key={r.id}>
              {r.childOrder}. Çocuk ({r.minAge}-{r.maxAge}): <strong>{r.price.toLocaleString('tr-TR')} TL</strong> ({r.discountPercent}% indirim)
            </p>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" disabled={saving} onClick={() => void addRule()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            {editingRuleId ? 'Değişiklikleri kaydet' : 'Tarih aralığı fiyatını ekle'}
          </button>
          {editingRuleId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
            >
              İptal
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <p className="border-b border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800">
          Kayıtlı fiyat kuralları ({rows.length})
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-2">Aralık</th>
                <th className="px-4 py-2">Günlük Otel Maliyeti</th>
                <th className="px-4 py-2">Kar %</th>
                <th className="px-4 py-2">Single Çarpan</th>
                <th className="px-4 py-2">Yuvarlama</th>
                <th className="px-4 py-2">Yetişkin</th>
                <th className="px-4 py-2">Çocuk Kuralları</th>
                <th className="px-4 py-2">Single</th>
                <th className="px-4 py-2 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const activityTotal = getIncludedActivityTotalByDate(r.fromDate);
                const adult = computeRuleAdultPrice({ ...r, nights: packageTour.nightCount, activityTotal });
                const single = computeRuleSinglePrice({ ...r, nights: packageTour.nightCount, activityTotal });
                return (
                  <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2">{r.fromDate} → {r.toDate}</td>
                    <td className="px-4 py-2">{r.costPrice}</td>
                    <td className="px-4 py-2">{r.profitPercent}</td>
                    <td className="px-4 py-2">{r.singleRoomMultiplier}</td>
                    <td className="px-4 py-2">{r.roundingMode === 'up' ? 'Yukarı' : 'Aşağı'}</td>
                    <td className="px-4 py-2">{adult.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-2">
                      <div className="space-y-1 text-xs">
                        {r.childAgeRules.map((c) => (
                          <p key={c.id}>
                            {c.childOrder}. çocuk {c.minAge}-{c.maxAge} %{c.discountPercent} indirim
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">{single.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button type="button" onClick={() => startEdit(r)} className="text-blue-600 dark:text-blue-400">Düzenle</button>
                        <button type="button" onClick={() => void removeRule(r.id)} className="text-red-600 dark:text-red-400">Sil</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

