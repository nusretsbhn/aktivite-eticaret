'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  applyAvailabilityRange,
  clearAvailabilityInRange,
  getAvailabilityForDate,
  setDayAvailable,
  setDayStatus,
} from '@/lib/availability-helpers';
import { expandDateRange } from '@/lib/price-helpers';
import type { AdminVilla } from '@/types/admin-villa';
import type { AvailabilityDayStatus, AvailabilityEntry } from '@/types/admin-activity';

type Props = { villaId: string };

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

const STATUS_OPTIONS: { value: AvailabilityDayStatus; label: string }[] = [
  { value: 'available', label: 'Müsait' },
  { value: 'full', label: 'Dolu' },
  { value: 'maintenance', label: 'Bakım' },
];

function labelForStatus(s: AvailabilityDayStatus) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

export function VillaAvailabilityClient({ villaId }: Props) {
  const router = useRouter();
  const [villa, setVilla] = useState<AdminVilla | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [singleDate, setSingleDate] = useState('');
  const [singleStatus, setSingleStatus] = useState<AvailabilityDayStatus>('available');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangeStatus, setRangeStatus] = useState<AvailabilityDayStatus>('full');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/villas/${villaId}`, { credentials: 'include' });
    if (!res.ok) {
      setError('Yüklenemedi');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { villa: AdminVilla };
    setVilla(data.villa);
    setLoading(false);
  }, [villaId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveAvailability(next: AvailabilityEntry[]) {
    if (!villa) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/villas/${villaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ availability: next }),
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
    if (!singleDate) return;
    const base = villa?.availability ?? [];
    let next: AvailabilityEntry[];
    if (singleStatus === 'available') {
      next = setDayAvailable(base, singleDate);
    } else {
      next = setDayStatus(base, singleDate, singleStatus);
    }
    await saveAvailability(next);
  }

  async function addRange() {
    if (!rangeFrom || !rangeTo) return;
    const from = new Date(`${rangeFrom}T12:00:00`);
    const to = new Date(`${rangeTo}T12:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      alert('Geçerli bir tarih aralığı seçin.');
      return;
    }
    const base = villa?.availability ?? [];
    if (rangeStatus !== 'available' && expandDateRange(rangeFrom, rangeTo, 0).length === 0) {
      alert('Geçerli bir tarih aralığı seçin.');
      return;
    }
    const next =
      rangeStatus === 'available'
        ? clearAvailabilityInRange(base, rangeFrom, rangeTo)
        : applyAvailabilityRange(base, rangeFrom, rangeTo, rangeStatus);
    await saveAvailability(next);
  }

  async function onCellStatusChange(iso: string, value: string) {
    const st = value as AvailabilityDayStatus;
    const base = villa?.availability ?? [];
    let next: AvailabilityEntry[];
    if (st === 'available') {
      next = setDayAvailable(base, iso);
    } else {
      next = setDayStatus(base, iso, st);
    }
    await saveAvailability(next);
  }

  async function removeDate(date: string) {
    const base = villa?.availability ?? [];
    await saveAvailability(setDayAvailable(base, date));
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const dim = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const pad = (firstDow + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  if (loading || !villa) {
    return <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Yükleniyor…'}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/villalar"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Villalara dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Müsaitlik takvimi</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{villa.displayName}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Tek tarih</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="date"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
            />
            <select
              className="min-w-[8rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={singleStatus}
              onChange={(e) => setSingleStatus(e.target.value as AvailabilityDayStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
          <div className="mt-3 flex flex-wrap gap-2">
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
            <select
              className="min-w-[8rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={rangeStatus}
              onChange={(e) => setRangeStatus(e.target.value as AvailabilityDayStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
              return <div key={`e-${idx}`} className="aspect-square min-h-[4.5rem]" />;
            }
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const st = getAvailabilityForDate(villa, iso);
            const border =
              st === 'full'
                ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
                : st === 'maintenance'
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
                  : 'border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50';
            return (
              <div
                key={iso}
                className={`flex min-h-[4.5rem] flex-col items-stretch justify-between rounded-lg border p-0.5 text-xs ${border}`}
              >
                <span className="px-1 pt-0.5 text-center font-medium text-zinc-800 dark:text-zinc-200">{day}</span>
                <select
                  className="mt-auto w-full cursor-pointer rounded border border-zinc-200 bg-white px-0.5 py-1 text-[10px] font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
                  value={st}
                  disabled={saving}
                  onChange={(e) => void onCellStatusChange(iso, e.target.value)}
                  aria-label={`${iso} müsaitlik`}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <p className="border-b border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800">
          Özel günler ({villa.availability.length})
        </p>
        <div className="max-h-80 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-950/80">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2 text-right">Sil</th>
              </tr>
            </thead>
            <tbody>
              {[...villa.availability]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((row) => (
                  <tr key={row.date} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2 font-mono text-xs">{row.date}</td>
                    <td className="px-4 py-2">{labelForStatus(row.status)}</td>
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
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
