'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { AdminPackageTourActivity } from '@/types/admin-package-tour-activity';
import type { AdminSettings } from '@/types/admin-settings';

type Props =
  | { mode: 'create'; packageTour?: undefined }
  | { mode: 'edit'; packageTour: AdminPackageTour };

type FormState = {
  packageName: string;
  conceptName: string;
  description: string;
  nightCount: string;
  dayCount: string;
  includedServiceIds: string[];
  paidServiceIds: string[];
  activityIds: string[];
  coverImageUrl: string;
  isActive: boolean;
};

function initialState(item?: AdminPackageTour): FormState {
  return {
    packageName: item?.packageName ?? '',
    conceptName: item?.conceptName ?? '',
    description: item?.description ?? '',
    nightCount: String(item?.nightCount ?? 1),
    dayCount: String(item?.dayCount ?? 1),
    includedServiceIds: item?.includedServiceIds ?? [],
    paidServiceIds: item?.paidServiceIds ?? [],
    activityIds: item?.activityIds ?? [],
    coverImageUrl: item?.coverImageUrl ?? '',
    isActive: item?.isActive ?? true,
  };
}

export function PackageTourForm({ mode, packageTour }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(packageTour));
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [activities, setActivities] = useState<AdminPackageTourActivity[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ settings: AdminSettings }>) : null))
      .then((d) => setSettings(d?.settings ?? null))
      .catch(() => setSettings(null));
    void fetch('/api/admin/package-tour-activities', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ activities: AdminPackageTourActivity[] }>) : null))
      .then((d) => setActivities(Array.isArray(d?.activities) ? d!.activities : []))
      .catch(() => setActivities([]));
  }, []);

  const ancillary = useMemo(
    () => settings?.packageTourManagement?.ancillaryServices ?? [],
    [settings?.packageTourManagement?.ancillaryServices],
  );

  function toggleInArray(key: 'includedServiceIds' | 'paidServiceIds' | 'activityIds', id: string) {
    setForm((prev) => {
      const set = new Set(prev[key]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [key]: [...set] };
    });
  }

  async function uploadCover(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('folder', 'package-tours');
      const res = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Kapak görseli yüklenemedi');
      }
      setForm((prev) => ({ ...prev, coverImageUrl: data.url! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kapak görseli yüklenemedi');
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      packageName: form.packageName.trim(),
      conceptName: form.conceptName.trim(),
      description: form.description.trim(),
      nightCount: Math.max(1, Number(form.nightCount) || 1),
      dayCount: Math.max(1, Number(form.dayCount) || 1),
      includedServiceIds: form.includedServiceIds,
      paidServiceIds: form.paidServiceIds,
      activityIds: form.activityIds,
      coverImageUrl: form.coverImageUrl.trim(),
      isActive: form.isActive,
    };
    try {
      const isEdit = mode === 'edit' && packageTour;
      const res = await fetch(isEdit ? `/api/admin/package-tours/${packageTour.id}` : '/api/admin/package-tours', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Kaydedilemedi');
      router.push('/admin/paket-turlar');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Paket Adı</span>
          <input required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.packageName} onChange={(e) => setForm((p) => ({ ...p, packageName: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Konsept Adı</span>
          <input required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.conceptName} onChange={(e) => setForm((p) => ({ ...p, conceptName: e.target.value }))} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-zinc-600 dark:text-zinc-300">Açıklama</span>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Gece Sayısı</span>
          <input type="number" min={1} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.nightCount} onChange={(e) => setForm((p) => ({ ...p, nightCount: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Gün Sayısı</span>
          <input type="number" min={1} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.dayCount} onChange={(e) => setForm((p) => ({ ...p, dayCount: e.target.value }))} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-zinc-600 dark:text-zinc-300">Paket Kapak Görseli</span>
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void uploadCover(file);
              e.currentTarget.value = '';
            }}
          />
          {uploadingCover && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Kapak yükleniyor…</p>}
          <div className="mt-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
            {form.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.coverImageUrl}
                alt="Paket kapak önizleme"
                className="aspect-[16/9] w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
              />
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Henüz kapak görseli yüklenmedi.</p>
            )}
          </div>
          {form.coverImageUrl && (
            <button
              type="button"
              className="mt-2 rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
              onClick={() => setForm((p) => ({ ...p, coverImageUrl: '' }))}
            >
              Kapak görselini kaldır
            </button>
          )}
        </label>
      </div>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Dahil olan hizmetler</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ancillary.map((svc) => (
            <label key={`inc-${svc.id}`} className="inline-flex items-center gap-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
              <input type="checkbox" checked={form.includedServiceIds.includes(svc.id)} onChange={() => toggleInArray('includedServiceIds', svc.id)} />
              <span>{svc.label}</span>
            </label>
          ))}
          {ancillary.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Ayarlar → Paket Tur sekmesinden hizmet ekleyin.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ücretli hizmetler</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ancillary.map((svc) => (
            <label key={`paid-${svc.id}`} className="inline-flex items-center gap-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
              <input type="checkbox" checked={form.paidServiceIds.includes(svc.id)} onChange={() => toggleInArray('paidServiceIds', svc.id)} />
              <span>{svc.label}</span>
            </label>
          ))}
          {ancillary.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Ayarlar → Paket Tur sekmesinden hizmet ekleyin.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Aktiviteler</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {activities.map((a) => (
            <label key={a.id} className="inline-flex items-center gap-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
              <input type="checkbox" checked={form.activityIds.includes(a.id)} onChange={() => toggleInArray('activityIds', a.id)} />
              <span>{a.name}</span>
            </label>
          ))}
          {activities.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz paket tur aktivitesi eklenmemiş.</p>}
        </div>
      </section>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
        Paket tur aktif
      </label>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          {saving ? 'Kaydediliyor…' : mode === 'create' ? 'Paket turu oluştur' : 'Kaydet'}
        </button>
        <Link href="/admin/paket-turlar" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600">
          Vazgeç
        </Link>
      </div>
    </form>
  );
}

