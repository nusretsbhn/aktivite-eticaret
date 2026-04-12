'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { resolveActivityPrices } from '@/lib/activity-pricing';
import { expandActivityPriceRange, mergePricesByDate } from '@/lib/price-helpers';
import type { AdminActivity, PriceEntry } from '@/types/admin-activity';

type Props = { activityId: string };

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function parseTriple(adultStr: string, childStr: string, infantStr: string): { price: number; priceChild: number; priceInfant: number } | null {
  const price = Number(adultStr);
  if (Number.isNaN(price) || price < 0) return null;
  const c = childStr.trim() === '' ? price : Number(childStr);
  const i = infantStr.trim() === '' ? price : Number(infantStr);
  if (Number.isNaN(c) || c < 0 || Number.isNaN(i) || i < 0) return null;
  return { price, priceChild: c, priceInfant: i };
}

export function PricesClient({ activityId }: Props) {
  const router = useRouter();
  const [activity, setActivity] = useState<AdminActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [singleDate, setSingleDate] = useState('');
  const [singleAdult, setSingleAdult] = useState('');
  const [singleChild, setSingleChild] = useState('');
  const [singleInfant, setSingleInfant] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangeAdult, setRangeAdult] = useState('');
  const [rangeChild, setRangeChild] = useState('');
  const [rangeInfant, setRangeInfant] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/activities/${activityId}`, { credentials: 'include' });
    if (!res.ok) {
      setError('Yüklenemedi');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { activity: AdminActivity };
    setActivity(data.activity);
    setLoading(false);
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const entryByDate = useMemo(() => {
    const m = new Map<string, PriceEntry>();
    if (!activity) return m;
    for (const p of activity.prices) m.set(p.date, p);
    return m;
  }, [activity]);

  async function savePrices(next: PriceEntry[]) {
    if (!activity) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prices: next }),
      });
      if (!res.ok) {
        alert('Kaydedilemedi');
        return;
      }
      void load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addSingle() {
    if (!singleDate || singleAdult === '') return;
    const t = parseTriple(singleAdult, singleChild, singleInfant);
    if (!t) return;
    const base = activity?.prices ?? [];
    const next = mergePricesByDate(base, [{ date: singleDate, ...t }]);
    await savePrices(next);
    setSingleAdult('');
    setSingleChild('');
    setSingleInfant('');
  }

  async function addRange() {
    if (!rangeFrom || !rangeTo || rangeAdult === '') return;
    const t = parseTriple(rangeAdult, rangeChild, rangeInfant);
    if (!t) return;
    const expanded = expandActivityPriceRange(rangeFrom, rangeTo, t);
    if (!expanded.length) {
      alert('Geçerli bir tarih aralığı seçin.');
      return;
    }
    const base = activity?.prices ?? [];
    const next = mergePricesByDate(base, expanded);
    await savePrices(next);
    setRangeAdult('');
    setRangeChild('');
    setRangeInfant('');
  }

  async function removeDate(date: string) {
    const base = activity?.prices ?? [];
    const next = base.filter((p) => p.date !== date);
    await savePrices(next);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const dim = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const pad = (firstDow + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  if (loading || !activity) {
    return <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Yükleniyor…'}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/aktiviteler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Aktivitelere dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Fiyat takvimi</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{activity.name}</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Yetişkin (13+), çocuk (3–12) ve bebek (0–2) için ayrı TL fiyatı girin. Çocuk/bebek boş bırakılırsa yetişkin fiyatı uygulanır.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Tek tarih</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input
              type="date"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
            />
            <label className="flex flex-col text-xs text-zinc-500">
              Yetişkin
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="₺"
                className="mt-0.5 w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={singleAdult}
                onChange={(e) => setSingleAdult(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-500">
              Çocuk
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="ops."
                className="mt-0.5 w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={singleChild}
                onChange={(e) => setSingleChild(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-500">
              Bebek
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="ops."
                className="mt-0.5 w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={singleInfant}
                onChange={(e) => setSingleInfant(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void addSingle()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Kaydet
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Tarih aralığı</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input
              type="date"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
            />
            <input
              type="date"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
            />
            <label className="flex flex-col text-xs text-zinc-500">
              Yetişkin
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="₺"
                className="mt-0.5 w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={rangeAdult}
                onChange={(e) => setRangeAdult(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-500">
              Çocuk
              <input
                type="number"
                min={0}
                step={0.01}
                className="mt-0.5 w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={rangeChild}
                onChange={(e) => setRangeChild(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-500">
              Bebek
              <input
                type="number"
                min={0}
                step={0.01}
                className="mt-0.5 w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={rangeInfant}
                onChange={(e) => setRangeInfant(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void addRange()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Aralığa uygula
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-600"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            ←
          </button>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {cursor.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-600"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`e-${idx}`} className="aspect-square" />;
            }
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = entryByDate.get(iso);
            const triple = entry ? resolveActivityPrices(entry) : null;
            return (
              <div
                key={iso}
                className="flex min-h-[5.5rem] flex-col items-stretch justify-start gap-0.5 rounded-lg border border-zinc-100 bg-zinc-50 p-1.5 text-left text-[10px] leading-tight dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <span className="text-center font-semibold text-zinc-800 dark:text-zinc-200">{day}</span>
                {triple ? (
                  <div className="flex flex-col gap-px text-zinc-700 dark:text-zinc-300">
                    <span>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Y </span>
                      {triple.adult} ₺
                    </span>
                    <span>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Ç </span>
                      {triple.child} ₺
                    </span>
                    <span>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">B </span>
                      {triple.infant} ₺
                    </span>
                  </div>
                ) : (
                  <span className="flex flex-1 items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <p className="border-b border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800">
          Tanımlı fiyatlar ({activity.prices.length})
        </p>
        <div className="max-h-80 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-950/80">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Yetişkin</th>
                <th className="px-4 py-2">Çocuk</th>
                <th className="px-4 py-2">Bebek</th>
                <th className="px-4 py-2 text-right">Sil</th>
              </tr>
            </thead>
            <tbody>
              {[...activity.prices]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((row) => {
                  const { adult, child, infant } = resolveActivityPrices(row);
                  return (
                    <tr key={row.date} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-2 font-mono text-xs">{row.date}</td>
                      <td className="px-4 py-2">{adult}</td>
                      <td className="px-4 py-2">{child}</td>
                      <td className="px-4 py-2">{infant}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => void removeDate(row.date)}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
