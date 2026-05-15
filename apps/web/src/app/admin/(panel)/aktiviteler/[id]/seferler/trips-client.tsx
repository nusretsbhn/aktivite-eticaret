'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { computeTripDurationHours } from '@/lib/trip-duration';
import type { ActivityScheduleMode, AdminActivity, FlexibleSchedule, TripEntry } from '@/types/admin-activity';

type Props = { activityId: string };

function blankTrip(): TripEntry {
  const departureTime = '09:00';
  const arrivalTime = '12:00';
  return {
    id: crypto.randomUUID(),
    departureTime,
    arrivalTime,
    durationHours: computeTripDurationHours(departureTime, arrivalTime),
  };
}

function blankFlexible(): FlexibleSchedule {
  return { label: 'Gün boyu esnek' };
}

export function TripsClient({ activityId }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ActivityScheduleMode>('trips');
  const [flexibleSchedule, setFlexibleSchedule] = useState<FlexibleSchedule>(blankFlexible());
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setName(data.activity.name);
    setScheduleMode(data.activity.scheduleMode === 'flexible' ? 'flexible' : 'trips');
    setFlexibleSchedule(data.activity.flexibleSchedule ?? blankFlexible());
    setTrips(
      data.activity.trips.map((t) => ({
        ...t,
        durationHours: computeTripDurationHours(t.departureTime, t.arrivalTime),
      })),
    );
    setLoading(false);
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  function patchTrip(id: string, patch: Partial<Pick<TripEntry, 'departureTime' | 'arrivalTime'>>) {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const departureTime = patch.departureTime ?? t.departureTime;
        const arrivalTime = patch.arrivalTime ?? t.arrivalTime;
        return {
          ...t,
          departureTime,
          arrivalTime,
          durationHours: computeTripDurationHours(departureTime, arrivalTime),
        };
      }),
    );
  }

  function patchFlexible(patch: Partial<FlexibleSchedule>) {
    setFlexibleSchedule((prev) => {
      const next = { ...prev, ...patch };
      const start = next.windowStart?.trim();
      const end = next.windowEnd?.trim();
      if (start && end && patch.durationHours === undefined) {
        next.durationHours = computeTripDurationHours(start, end);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduleMode,
          flexibleSchedule: scheduleMode === 'flexible' ? flexibleSchedule : undefined,
          trips: scheduleMode === 'trips' ? trips : trips,
        }),
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

  if (loading) {
    return <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Yükleniyor…'}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/aktiviteler"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Aktivitelere dön
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Seferler ve saatler</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{name}</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Saat tipi</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Sabit sefer saatleri tanımlayabilir veya esnek aktivite saati seçebilirsiniz.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700">
            <input
              type="radio"
              name="scheduleMode"
              checked={scheduleMode === 'trips'}
              onChange={() => setScheduleMode('trips')}
            />
            <span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">Sefer tanımla</span>
              <span className="mt-0.5 block text-xs text-zinc-500">Kalkış / varış saatleri listesi</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700">
            <input
              type="radio"
              name="scheduleMode"
              checked={scheduleMode === 'flexible'}
              onChange={() => setScheduleMode('flexible')}
            />
            <span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">Esnek aktivite saati</span>
              <span className="mt-0.5 block text-xs text-zinc-500">Müşteriye esnek saat metni gösterilir</span>
            </span>
          </label>
        </div>
      </section>

      {scheduleMode === 'flexible' ? (
        <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Esnek saat bilgisi</h2>
          <label className="block text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Gösterim metni</span>
            <input
              type="text"
              placeholder="Gün boyu esnek, Randevuya göre…"
              className="mt-1 min-h-11 w-full max-w-lg rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              value={flexibleSchedule.label ?? ''}
              onChange={(e) => patchFlexible({ label: e.target.value })}
            />
          </label>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Müşteri arayüzünde &quot;Esnek saat&quot; rozeti ile birlikte bu metin görünür. Boş bırakırsanız saat
            penceresi veya varsayılan &quot;Esnek saat&quot; kullanılır.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">Başlangıç (opsiyonel)</span>
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                value={flexibleSchedule.windowStart ?? ''}
                onChange={(e) => patchFlexible({ windowStart: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">Bitiş (opsiyonel)</span>
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                value={flexibleSchedule.windowEnd ?? ''}
                onChange={(e) => patchFlexible({ windowEnd: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">Tur süresi (saat)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                value={flexibleSchedule.durationHours ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  patchFlexible({ durationHours: v === '' ? undefined : Number(v) });
                }}
              />
            </label>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Başlangıç ve bitiş girilirse süre otomatik hesaplanır; isterseniz süreyi elle değiştirebilirsiniz.
          </p>
        </section>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setTrips((t) => [...t, blankTrip()])}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
            >
              Sefer ekle
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3">Kalkış saati</th>
                  <th className="px-4 py-3">Varış saati</th>
                  <th className="px-4 py-3">Tur süresi (saat)</th>
                  <th className="px-4 py-3 text-right">Sil</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      Henüz sefer yok. &quot;Sefer ekle&quot; ile ekleyin.
                    </td>
                  </tr>
                )}
                {trips.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
                        value={t.departureTime}
                        onChange={(e) => patchTrip(t.id, { departureTime: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
                        value={t.arrivalTime}
                        onChange={(e) => patchTrip(t.id, { arrivalTime: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {t.durationHours}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        className="text-red-600 dark:text-red-400"
                        onClick={() => setTrips((prev) => prev.filter((x) => x.id !== t.id))}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tur süresi kalkış ve varış saatlerine göre otomatik hesaplanır (gece yarısı geçişi desteklenir).
          </p>
        </>
      )}
    </div>
  );
}
