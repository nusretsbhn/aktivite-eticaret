'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { AdminActivity } from '@/types/admin-activity';
import type { AdminPackage } from '@/types/admin-package';

type Props = { mode: 'create' } | { mode: 'edit'; pkg: AdminPackage };

type FormState = {
  name: string;
  description: string;
  activityIds: string[];
  coverImageUrl: string;
  isActive: boolean;
};

export function PackageForm(props: Props) {
  const router = useRouter();
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial: FormState = useMemo(() => {
    if (props.mode === 'edit') {
      return {
        name: props.pkg.name,
        description: props.pkg.description,
        activityIds: props.pkg.activityIds,
        coverImageUrl: props.pkg.coverImageUrl,
        isActive: props.pkg.isActive,
      };
    }
    return {
      name: '',
      description: '',
      activityIds: [],
      coverImageUrl: '',
      isActive: true,
    };
  }, [props.mode, props.mode === 'edit' ? props.pkg.id : 'create']);
  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    // Reset only when switching create/edit target, not on every re-render.
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', '500');
    void fetch(`/api/admin/activities?${params.toString()}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json() as Promise<{ activities: AdminActivity[] }>)
      .then((data) => {
        if (cancelled) return;
        setActivities(Array.isArray(data.activities) ? data.activities : []);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleActivity(id: string) {
    setForm((f) => {
      const set = new Set(f.activityIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, activityIds: [...set] };
    });
  }

  async function uploadCover(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('folder', 'packages');
    const res = await fetch('/api/admin/settings/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = (await res.json()) as { error?: string; url?: string };
    if (!res.ok || !data.url) {
      setError(data.error ?? 'Kapak yüklenemedi');
      return;
    }
    setForm((f) => ({ ...f, coverImageUrl: data.url ?? '' }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Paket adı zorunludur.');
      return;
    }
    if (!form.activityIds.length) {
      setError('En az bir aktivite seçmelisiniz.');
      return;
    }
    setPending(true);
    try {
      if (props.mode === 'create') {
        const res = await fetch('/api/admin/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Kayıt başarısız');
          return;
        }
      } else {
        const res = await fetch(`/api/admin/packages/${props.pkg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Güncelleme başarısız');
          return;
        }
      }
      router.push('/admin/paketler');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {props.mode === 'edit' ? (
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Paket ID</span>
            <input
              readOnly
              value={props.pkg.packageId}
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            />
          </label>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Paket ID</span>
            <p className="mt-1">Kayıt sırasında sistem tarafından otomatik atanır.</p>
          </div>
        )}

        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Paket adı *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Açıklama</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">Kapak resmi</p>
        <input
          type="file"
          accept="image/*"
          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void uploadCover(file);
            e.currentTarget.value = '';
          }}
        />
        {form.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverImageUrl}
            alt="Paket kapak"
            className="mt-3 aspect-[16/9] w-full max-w-sm rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Kapak seçilmedi.</p>
        )}
      </div>

      <fieldset className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <legend className="px-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Paket aktiviteleri *
        </legend>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Sistemde kayıtlı aktivitelerden birden fazla seçebilirsiniz.
        </p>
        <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          {activities.map((a) => (
            <label key={a.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activityIds.includes(a.id)}
                onChange={() => toggleActivity(a.id)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.name}</span>
                <span className="ml-2 text-xs text-zinc-500">{a.activityId}</span>
              </span>
            </label>
          ))}
          {!activities.length && <p className="text-sm text-zinc-500">Aktivite bulunamadı.</p>}
        </div>
      </fieldset>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        <span className="text-zinc-800 dark:text-zinc-200">Durum: Aktif</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? 'Kaydediliyor…' : props.mode === 'create' ? 'Kaydet' : 'Güncelle'}
        </button>
        <Link
          href="/admin/paketler"
          className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}

