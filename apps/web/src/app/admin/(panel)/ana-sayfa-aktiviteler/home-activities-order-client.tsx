'use client';

import Link from 'next/link';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';

import { buildHomeActivityOrderFromActivities } from '@/lib/home-activity-order';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

function move<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return arr;
  next.splice(to, 0, item);
  return next;
}

const HOME_WIDGET_LIMIT = 12;

type Props = {
  initialSettings: AdminSettings;
  initialActivities: AdminActivity[];
};

export function HomeActivitiesOrderClient({ initialSettings, initialActivities }: Props) {
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [ordered, setOrdered] = useState<AdminActivity[]>(() =>
    buildHomeActivityOrderFromActivities(
      initialActivities,
      initialSettings.siteManagement?.homeActivityOrder,
    ),
  );
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const totalActive = ordered.length;

  async function save(nextOrdered: AdminActivity[]) {
    if (!settings.siteManagement) {
      setError('Site ayarları bulunamadı.');
      return;
    }
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const homeActivityOrder = nextOrdered.map((a) => a.id);
      const next: AdminSettings = {
        ...settings,
        siteManagement: {
          ...settings.siteManagement,
          homeActivityOrder,
        },
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { error?: string; settings?: AdminSettings };
      if (!res.ok) {
        setError(data.error ?? 'Kaydedilemedi');
        return;
      }
      if (data.settings) {
        setSettings(data.settings);
        setOrdered(nextOrdered);
      }
      setOk('Sıra kaydedildi');
      setTimeout(() => setOk(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  function shift(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= ordered.length) return;
    void save(move(ordered, index, to));
  }

  function reorderByDrag(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIdx = ordered.findIndex((a) => a.id === fromId);
    const toIdx = ordered.findIndex((a) => a.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    void save(move(ordered, fromIdx, toIdx));
  }

  function resetByCreatedAt() {
    const next = ordered
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    void save(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Panele dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Ana sayfa aktivite sırası
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ana sayfadaki <strong>Aktiviteler</strong> widget’ında yalnızca <strong>aktif</strong> aktiviteler
          gösterilir. İlk {HOME_WIDGET_LIMIT} sıradaki kartlar sitede listelenir. Pasif aktiviteler bu listede
          yer almaz.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {ok}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Aktif aktiviteler ({totalActive})
          </p>
          <button
            type="button"
            disabled={saving || !ordered.length}
            onClick={() => void resetByCreatedAt()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          >
            En yeniye göre sıfırla
          </button>
        </div>

        {!ordered.length ? (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Aktif aktivite yok.{' '}
            <Link href="/admin/aktiviteler" className="font-medium text-blue-600 hover:text-blue-500">
              Aktiviteler
            </Link>{' '}
            bölümünden aktivite ekleyip yayına alın.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {ordered.map((a, index) => {
              const onHome = index < HOME_WIDGET_LIMIT;
              return (
                <li
                  key={a.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData('text/plain');
                    if (fromId && fromId !== a.id) reorderByDrag(fromId, a.id);
                  }}
                  className={`flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0 ${
                    draggingId === a.id ? 'rounded-lg bg-blue-50/80 ring-2 ring-blue-400/50 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <div
                    draggable={!saving}
                    role="button"
                    tabIndex={0}
                    aria-label="Sürükleyerek sırayı değiştir"
                    onDragStart={(e) => {
                      if (saving) {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.setData('text/plain', a.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggingId(a.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ${
                      saving ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <GripVertical className="h-5 w-5 shrink-0" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400">#{index + 1}</span>
                      {onHome ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                          Ana sayfada
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Yedek sıra
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {a.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {a.location || a.departurePlace || '—'} · {a.activityId}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      onClick={() => shift(index, -1)}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
                      aria-label="Yukarı"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={saving || index === ordered.length - 1}
                      onClick={() => shift(index, 1)}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
                      aria-label="Aşağı"
                    >
                      ↓
                    </button>
                    <Link
                      href={`/admin/aktiviteler/${a.id}/duzenle`}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600"
                    >
                      Düzenle
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Sol tutamaktan sürükleyip bırakarak veya yukarı / aşağı oklarıyla sırayı değiştirebilirsiniz; kayıt
        otomatik yapılır. Yeni eklenen aktif aktiviteler, listede yoksa listenin sonuna eklenir.
      </p>
    </div>
  );
}
