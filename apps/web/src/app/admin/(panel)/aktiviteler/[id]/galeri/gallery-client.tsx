'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, X } from 'lucide-react';

import type { AdminActivity, GalleryItem } from '@/types/admin-activity';

type Props = { activityId: string };

export function GalleryClient({ activityId }: Props) {
  const router = useRouter();
  const [activity, setActivity] = useState<AdminActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function persistGallery(next: GalleryItem[]) {
    const res = await fetch(`/api/admin/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ gallery: next }),
    });
    if (!res.ok) {
      alert('Kaydedilemedi');
      return;
    }
    void load();
    router.refresh();
  }

  function reorder(fromId: string, toId: string) {
    if (!activity) return;
    const items = [...activity.gallery].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = items.findIndex((x) => x.id === fromId);
    const toIdx = items.findIndex((x) => x.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = items.splice(fromIdx, 1);
    if (!moved) return;
    items.splice(toIdx, 0, moved);
    const next = items.map((g, i) => ({ ...g, sortOrder: i }));
    void persistGallery(next);
  }

  async function setCover(id: string) {
    if (!activity) return;
    const next = activity.gallery.map((g) => ({ ...g, isCover: g.id === id }));
    await persistGallery(next);
  }

  async function removeItem(id: string) {
    if (!activity) return;
    if (!confirm('Bu görseli veya videoyu silmek istediğinize emin misiniz?')) return;
    const items = [...activity.gallery].sort((a, b) => a.sortOrder - b.sortOrder);
    const deletedWasCover = items.some((g) => g.id === id && g.isCover);
    const filtered = items.filter((g) => g.id !== id);
    let next = filtered.map((g, i) => ({ ...g, sortOrder: i }));
    if (deletedWasCover && next.length > 0) {
      next = next.map((g, i) => ({ ...g, isCover: i === 0 }));
    }
    await persistGallery(next);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set('file', file);
        const res = await fetch(`/api/admin/activities/${activityId}/gallery`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          alert(j.error ?? 'Yükleme başarısız');
          break;
        }
      }
      void load();
      router.refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (loading || !activity) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Yükleniyor…'}</p>
    );
  }

  const sorted = [...activity.gallery].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/aktiviteler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Aktivitelere dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Galeri</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{activity.name}</p>
      </div>

      <div
        className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-600 dark:bg-zinc-950/40"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          void onUpload(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => void onUpload(e.target.files)}
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Resim veya video sürükleyip bırakın ya da dosya seçin.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Desteklenen: JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV</p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {uploading ? 'Yükleniyor…' : 'Dosya seç'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item) => (
          <div
            key={item.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromId = e.dataTransfer.getData('text/plain');
              if (fromId && fromId !== item.id) reorder(fromId, item.id);
            }}
            className={`relative overflow-hidden rounded-xl border transition-[box-shadow,opacity] ${
              draggingId === item.id ? 'opacity-70 ring-2 ring-blue-400/60' : ''
            } ${
              item.isCover
                ? 'border-amber-500 ring-2 ring-amber-400/40'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <div
              draggable
              role="button"
              tabIndex={0}
              aria-label="Sürükleyerek sırayı değiştir"
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingId(item.id);
              }}
              onDragEnd={() => setDraggingId(null)}
              className="absolute left-2 top-12 z-10 flex h-9 w-9 cursor-grab items-center justify-center rounded-lg border border-zinc-200/80 bg-white/95 text-zinc-600 shadow-md backdrop-blur-sm active:cursor-grabbing dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300"
            >
              <GripVertical className="h-5 w-5 shrink-0" aria-hidden />
            </div>
            <button
              type="button"
              aria-label="Galeriden kaldır"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void removeItem(item.id);
              }}
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/70 text-white shadow-md backdrop-blur-sm transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            {item.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img draggable={false} src={item.url} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <video src={item.url} className="aspect-video w-full object-cover" controls muted />
            )}
            <div className="flex flex-wrap gap-2 p-2">
              <button
                type="button"
                onClick={() => void setCover(item.id)}
                className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
              >
                {item.isCover ? 'Kapak' : 'Kapak yap'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Sırayı değiştirmek için soldaki tutamacı sürükleyip başka bir kartın üzerine bırakın.
      </p>
    </div>
  );
}
