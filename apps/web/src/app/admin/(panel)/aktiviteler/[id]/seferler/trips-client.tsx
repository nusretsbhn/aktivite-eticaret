'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { computeTripDurationHours } from '@/lib/trip-duration';
import type { AdminActivity, TripEntry } from '@/types/admin-activity';

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

export function TripsClient({ activityId }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
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

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trips }),
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
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Seferler</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTrips((t) => [...t, blankTrip()])}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
          >
            Sefer ekle
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
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
        Tur süresi kalkış ve varış saatlerine göre otomatik hesaplanır (gece yarısı geçişi
        desteklenir). Değişiklikleri kaydetmek için &quot;Kaydet&quot;e basın.
      </p>
    </div>
  );
}
