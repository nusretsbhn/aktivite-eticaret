'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type {
  AdminPackageTourActivity,
  PackageTourActivityPriceEntry,
} from '@/types/admin-package-tour-activity';

type Props = { activity: AdminPackageTourActivity };

function normalizeTriple(row: Partial<PackageTourActivityPriceEntry>): PackageTourActivityPriceEntry | null {
  const date = String(row.date ?? '').trim();
  const adult = Number(row.price);
  const child = row.priceChild === undefined ? adult : Number(row.priceChild);
  const infant = row.priceInfant === undefined ? adult : Number(row.priceInfant);
  if (!date || !Number.isFinite(adult) || adult < 0) return null;
  if (!Number.isFinite(child) || child < 0 || !Number.isFinite(infant) || infant < 0) return null;
  return { date, price: adult, priceChild: child, priceInfant: infant };
}

export function PackageTourActivityPricesClient({ activity }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<PackageTourActivityPriceEntry[]>(() => [...activity.prices]);
  const [saving, setSaving] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [singleAdult, setSingleAdult] = useState('');
  const [singleChild, setSingleChild] = useState('');
  const [singleInfant, setSingleInfant] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangeAdult, setRangeAdult] = useState('');
  const [rangeChild, setRangeChild] = useState('');
  const [rangeInfant, setRangeInfant] = useState('');

  const byDate = useMemo(() => new Map(rows.map((x) => [x.date, x])), [rows]);

  async function persist(next: PackageTourActivityPriceEntry[]) {
    setSaving(true);
    const res = await fetch(`/api/admin/package-tour-activities/${activity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prices: next }),
    });
    setSaving(false);
    if (!res.ok) {
      alert('Kaydedilemedi');
      return;
    }
    setRows(next);
    router.refresh();
  }

  function expandRange(from: string, to: string, row: Omit<PackageTourActivityPriceEntry, 'date'>) {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
    const out: PackageTourActivityPriceEntry[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const date = cursor.toISOString().slice(0, 10);
      out.push({ date, ...row });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  async function saveSingle() {
    const row = normalizeTriple({
      date: singleDate,
      price: Number(singleAdult),
      priceChild: singleChild === '' ? Number(singleAdult) : Number(singleChild),
      priceInfant: singleInfant === '' ? Number(singleAdult) : Number(singleInfant),
    });
    if (!row) return;
    const map = new Map(byDate);
    map.set(row.date, row);
    await persist([...map.values()].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function saveRange() {
    const row = normalizeTriple({
      date: 'x',
      price: Number(rangeAdult),
      priceChild: rangeChild === '' ? Number(rangeAdult) : Number(rangeChild),
      priceInfant: rangeInfant === '' ? Number(rangeAdult) : Number(rangeInfant),
    });
    if (!row || !rangeFrom || !rangeTo) return;
    const expanded = expandRange(rangeFrom, rangeTo, {
      price: row.price,
      priceChild: row.priceChild,
      priceInfant: row.priceInfant,
    });
    const map = new Map(byDate);
    for (const item of expanded) map.set(item.date, item);
    await persist([...map.values()].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function removeDate(date: string) {
    await persist(rows.filter((x) => x.date !== date));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/paket-tur-aktiviteleri" className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          ← Paket tur aktivitelerine dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Fiyat Takvimi</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{activity.name}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium">Tek tarih fiyat</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input type="date" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} />
            <input type="number" min={0} step={0.01} placeholder="Yetişkin +13" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={singleAdult} onChange={(e) => setSingleAdult(e.target.value)} />
            <input type="number" min={0} step={0.01} placeholder="Çocuk 3-12" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={singleChild} onChange={(e) => setSingleChild(e.target.value)} />
            <input type="number" min={0} step={0.01} placeholder="Bebek 0-2" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={singleInfant} onChange={(e) => setSingleInfant(e.target.value)} />
            <button type="button" onClick={() => void saveSingle()} disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Kaydet</button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium">Tarih aralığı fiyat</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input type="date" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
            <input type="date" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
            <input type="number" min={0} step={0.01} placeholder="Yetişkin +13" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={rangeAdult} onChange={(e) => setRangeAdult(e.target.value)} />
            <input type="number" min={0} step={0.01} placeholder="Çocuk 3-12" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={rangeChild} onChange={(e) => setRangeChild(e.target.value)} />
            <input type="number" min={0} step={0.01} placeholder="Bebek 0-2" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={rangeInfant} onChange={(e) => setRangeInfant(e.target.value)} />
            <button type="button" onClick={() => void saveRange()} disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Aralığa uygula</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <p className="border-b border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800">
          Tanımlı fiyatlar ({rows.length})
        </p>
        <div className="max-h-96 overflow-auto">
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
              {[...rows].sort((a, b) => b.date.localeCompare(a.date)).map((row) => (
                <tr key={row.date} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-2 font-mono text-xs">{row.date}</td>
                  <td className="px-4 py-2">{row.price}</td>
                  <td className="px-4 py-2">{row.priceChild ?? row.price}</td>
                  <td className="px-4 py-2">{row.priceInfant ?? row.price}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" className="text-red-600 dark:text-red-400" onClick={() => void removeDate(row.date)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

