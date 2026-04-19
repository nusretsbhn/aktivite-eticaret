'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  AdminPackageTourActivity,
  PackageTourGalleryItem,
} from '@/types/admin-package-tour-activity';

type Props =
  | { mode: 'create'; activity?: undefined }
  | { mode: 'edit'; activity: AdminPackageTourActivity };

type FormState = {
  name: string;
  description: string;
  location: string;
  category: string;
  videoUrl: string;
  gallery: PackageTourGalleryItem[];
  isActive: boolean;
};

function initialState(activity?: AdminPackageTourActivity): FormState {
  return {
    name: activity?.name ?? '',
    description: activity?.description ?? '',
    location: activity?.location ?? '',
    category: activity?.category ?? '',
    videoUrl: activity?.videoUrl ?? '',
    gallery: [...(activity?.gallery ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    isActive: activity?.isActive ?? true,
  };
}

export function PackageTourActivityForm({ mode, activity }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(() => initialState(activity));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next = [...form.gallery];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set('file', file);
        fd.set('folder', 'package-tour-activities');
        const res = await fetch('/api/admin/settings/upload', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? 'Görsel yüklenemedi');
        next.push({
          id: crypto.randomUUID(),
          url: data.url,
          sortOrder: next.length,
          isCover: next.length === 0,
        });
      }
      setForm((prev) => ({ ...prev, gallery: next }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme hatası');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function moveImage(index: number, dir: -1 | 1) {
    setForm((prev) => {
      const arr = [...prev.gallery];
      const nextIndex = index + dir;
      if (nextIndex < 0 || nextIndex >= arr.length) return prev;
      const temp = arr[index];
      arr[index] = arr[nextIndex]!;
      arr[nextIndex] = temp!;
      return {
        ...prev,
        gallery: arr.map((g, i) => ({ ...g, sortOrder: i })),
      };
    });
  }

  function removeImage(id: string) {
    setForm((prev) => {
      const filtered = prev.gallery.filter((g) => g.id !== id).map((g, i) => ({ ...g, sortOrder: i }));
      if (filtered.length > 0 && !filtered.some((g) => g.isCover)) filtered[0]!.isCover = true;
      return { ...prev, gallery: filtered };
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        category: form.category.trim(),
        videoUrl: form.videoUrl.trim(),
        gallery: form.gallery.map((g, i) => ({ ...g, sortOrder: i })),
        isActive: form.isActive,
      };
      const isEdit = mode === 'edit' && activity;
      const res = await fetch(
        isEdit ? `/api/admin/package-tour-activities/${activity.id}` : '/api/admin/package-tour-activities',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string; activity?: AdminPackageTourActivity };
      if (!res.ok) throw new Error(data.error ?? 'Kaydedilemedi');
      router.push('/admin/paket-tur-aktiviteleri');
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
          <span className="text-zinc-600 dark:text-zinc-300">Aktivite Adı</span>
          <input className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        </label>
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Konum</span>
          <input className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-zinc-600 dark:text-zinc-300">Açıklama</span>
          <textarea className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
        </label>
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Kategori</span>
          <input className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
        </label>
        <label className="text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Video URL (varsa)</span>
          <input className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} />
        </label>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Galeri</p>
        <div className="mt-3 flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void uploadFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
            {uploading ? 'Yükleniyor…' : 'Toplu Resim Ekle'}
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {form.gallery.map((g, i) => (
            <div key={g.id} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt="" className="aspect-video w-full rounded-md object-cover" />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => moveImage(i, -1)} className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600">Yukarı</button>
                <button type="button" onClick={() => moveImage(i, 1)} className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600">Aşağı</button>
                <button type="button" onClick={() => setForm((p) => ({ ...p, gallery: p.gallery.map((x) => ({ ...x, isCover: x.id === g.id })) }))} className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 dark:border-amber-700 dark:text-amber-300">
                  {g.isCover ? 'Kapak' : 'Kapak yap'}
                </button>
                <button type="button" onClick={() => removeImage(g.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-300">Sil</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
        Aktivite aktif
      </label>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900">
          {saving ? 'Kaydediliyor…' : mode === 'create' ? 'Aktiviteyi oluştur' : 'Kaydet'}
        </button>
        <Link href="/admin/paket-tur-aktiviteleri" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600">
          Vazgeç
        </Link>
      </div>
    </form>
  );
}

