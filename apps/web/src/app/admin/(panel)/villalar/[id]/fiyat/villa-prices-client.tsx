'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { expandDateRange, mergePricesByDate } from '@/lib/price-helpers';
import type { AdminVilla } from '@/types/admin-villa';
import type { PriceEntry } from '@/types/admin-activity';

type Props = { villaId: string };

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function currencySymbol(currency: AdminVilla['paymentCurrency']): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '₺';
  }
}

export function VillaPricesClient({ villaId }: Props) {
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
  const [singlePrice, setSinglePrice] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangePrice, setRangePrice] = useState('');

  const [legacyPricesFile, setLegacyPricesFile] = useState<File | null>(null);
  const [legacyAvailabilityFile, setLegacyAvailabilityFile] = useState<File | null>(null);
  const [legacyPriceMode, setLegacyPriceMode] = useState<'merge' | 'replace'>('merge');
  const [legacyAvailabilityMode, setLegacyAvailabilityMode] = useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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

  const sym = villa ? currencySymbol(villa.paymentCurrency) : '₺';

  const priceByDate = useMemo(() => {
    const m = new Map<string, number>();
    if (!villa) return m;
    for (const p of villa.prices) m.set(p.date, p.price);
    return m;
  }, [villa]);

  async function savePrices(next: PriceEntry[]) {
    if (!villa) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/villas/${villaId}`, {
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
    if (!singleDate || singlePrice === '') return;
    const price = Number(singlePrice);
    if (Number.isNaN(price)) return;
    const base = villa?.prices ?? [];
    const next = mergePricesByDate(base, [{ date: singleDate, price }]);
    await savePrices(next);
    setSinglePrice('');
  }

  async function addRange() {
    if (!rangeFrom || !rangeTo || rangePrice === '') return;
    const price = Number(rangePrice);
    if (Number.isNaN(price)) return;
    const expanded = expandDateRange(rangeFrom, rangeTo, price);
    if (!expanded.length) {
      alert('Geçerli bir tarih aralığı seçin.');
      return;
    }
    const base = villa?.prices ?? [];
    const next = mergePricesByDate(base, expanded);
    await savePrices(next);
    setRangePrice('');
  }

  async function removeDate(date: string) {
    const base = villa?.prices ?? [];
    const next = base.filter((p) => p.date !== date);
    await savePrices(next);
  }

  async function importLegacyCalendar() {
    if (!legacyPricesFile && !legacyAvailabilityFile) {
      setImportMessage('En az bir JSON dosyası seçin.');
      return;
    }
    setImporting(true);
    setImportMessage(null);
    try {
      const fd = new FormData();
      if (legacyPricesFile) fd.append('prices', legacyPricesFile);
      if (legacyAvailabilityFile) fd.append('availability', legacyAvailabilityFile);
      fd.append('priceMode', legacyPriceMode);
      fd.append('availabilityMode', legacyAvailabilityMode);

      const res = await fetch(`/api/admin/villas/${villaId}/import-calendar`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = (await res.json()) as { error?: string; summary?: { priceRows: number; availabilityDates: number } };
      if (!res.ok) {
        setImportMessage(data.error ?? 'Aktarılamadı');
        return;
      }
      const parts: string[] = [];
      if (data.summary && data.summary.priceRows > 0) {
        parts.push(`${data.summary.priceRows} fiyat satırı`);
      }
      if (data.summary && data.summary.availabilityDates > 0) {
        parts.push(`${data.summary.availabilityDates} müsaitlik günü`);
      }
      setImportMessage(parts.length ? `Aktarıldı: ${parts.join(', ')}.` : 'Kaydedildi.');
      setLegacyPricesFile(null);
      setLegacyAvailabilityFile(null);
      void load();
      router.refresh();
    } finally {
      setImporting(false);
    }
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
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Gecelik fiyat takvimi</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{villa.displayName}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Para birimi: {villa.paymentCurrency} (villa &quot;Fiyat kuralları&quot; sekmesinden)
        </p>
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
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Fiyat"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={singlePrice}
              onChange={(e) => setSinglePrice(e.target.value)}
            />
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
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Fiyat"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={rangePrice}
              onChange={(e) => setRangePrice(e.target.value)}
            />
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
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Eski siteden aktar (JSON)</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Eski panelden export ettiğiniz <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">prices.json</code> ve{' '}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">availability.json</code> dosyalarını yükleyin. En az
          biri zorunlu; ikisini birden seçebilirsiniz. Villa kimliği bu sayfadaki villa ile eşleştirilir (dosyadaki{' '}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">villa_id</code> yok sayılır).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Fiyat JSON
            <input
              type="file"
              accept="application/json,.json"
              className="mt-1 block w-full text-sm text-zinc-600 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
              onChange={(e) => setLegacyPricesFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Müsaitlik JSON
            <input
              type="file"
              accept="application/json,.json"
              className="mt-1 block w-full text-sm text-zinc-600 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
              onChange={(e) => setLegacyAvailabilityFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Fiyatlar
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={legacyPriceMode}
              onChange={(e) => setLegacyPriceMode(e.target.value === 'replace' ? 'replace' : 'merge')}
            >
              <option value="merge">Mevcut fiyatlarla birleştir</option>
              <option value="replace">Tüm fiyatları dosyayla değiştir</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Müsaitlik
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={legacyAvailabilityMode}
              onChange={(e) => setLegacyAvailabilityMode(e.target.value === 'replace' ? 'replace' : 'merge')}
            >
              <option value="merge">Mevcut kayıtlarla birleştir</option>
              <option value="replace">Dosyada geçen tarihlerde yeniden uygula</option>
            </select>
          </label>
        </div>
        {importMessage && (
          <p
            className={`mt-3 text-sm ${importMessage.startsWith('Aktarıldı') || importMessage === 'Kaydedildi.' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {importMessage}
          </p>
        )}
        <button
          type="button"
          disabled={importing || saving}
          onClick={() => void importLegacyCalendar()}
          className="mt-4 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {importing ? 'Aktarılıyor…' : 'Dışardan aktar'}
        </button>
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
            const p = priceByDate.get(iso);
            return (
              <div
                key={iso}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-xs dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{day}</span>
                <span className="mt-0.5 text-[10px] text-zinc-500">
                  {p !== undefined ? `${p} ${sym}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <p className="border-b border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800">
          Tanımlı fiyatlar ({villa.prices.length})
        </p>
        <div className="max-h-80 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-950/80">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Fiyat ({sym})</th>
                <th className="px-4 py-2 text-right">Sil</th>
              </tr>
            </thead>
            <tbody>
              {[...villa.prices]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((row) => (
                  <tr key={row.date} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2 font-mono text-xs">{row.date}</td>
                    <td className="px-4 py-2">{row.price}</td>
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
