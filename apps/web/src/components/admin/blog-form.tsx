'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { BlogPost } from '@/types/blog';

type Props = { mode: 'create' } | { mode: 'edit'; post: BlogPost };

type FormState = {
  title: string;
  body: string;
  excerpt: string;
  coverImageUrl: string;
  isActive: boolean;
};

export function BlogForm(props: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial: FormState = useMemo(() => {
    if (props.mode === 'edit') {
      return {
        title: props.post.title,
        body: props.post.body,
        excerpt: props.post.excerpt,
        coverImageUrl: props.post.coverImageUrl,
        isActive: props.post.isActive,
      };
    }
    return {
      title: '',
      body: '',
      excerpt: '',
      coverImageUrl: '',
      isActive: true,
    };
  }, [props.mode, props.mode === 'edit' ? props.post.id : 'create']);

  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  async function uploadCover(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('folder', 'blog');
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
    if (!form.title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    if (!form.body.trim()) {
      setError('Blog yazısı zorunludur.');
      return;
    }
    if (!form.coverImageUrl.trim()) {
      setError('Kapak resmi yükleyin.');
      return;
    }

    setPending(true);
    try {
      if (props.mode === 'create') {
        const res = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: form.title,
            body: form.body,
            excerpt: form.excerpt.trim() || undefined,
            coverImageUrl: form.coverImageUrl,
            isActive: form.isActive,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Kayıt başarısız');
          return;
        }
        router.push('/admin/blog');
        router.refresh();
        return;
      }

      const res = await fetch(`/api/admin/blog/${props.post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          excerpt: form.excerpt.trim() || undefined,
          coverImageUrl: form.coverImageUrl,
          isActive: form.isActive,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Güncellenemedi');
        return;
      }
      router.push('/admin/blog');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    'mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 sm:min-h-10 sm:text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Başlık</span>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          autoComplete="off"
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Blog yazısı</span>
        <textarea
          className={`${inputClass} min-h-[220px] resize-y`}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          required
          placeholder="Paragrafları boş satırla ayırabilirsiniz. İlk paragraf sitede vurgulu gösterilir."
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Özet (isteğe bağlı — boş bırakılırsa otomatik üretilir)</span>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Kapak resmi</span>
        {form.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverImageUrl}
            alt="Kapak"
            className="max-h-48 w-full max-w-md rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : (
          <p className="text-sm text-zinc-500">Henüz yüklenmedi.</p>
        )}
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-900"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadCover(f);
            e.target.value = '';
          }}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <span className="text-zinc-700 dark:text-zinc-300">Yayında (aktif)</span>
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? 'Kaydediliyor…' : props.mode === 'create' ? 'Kaydet' : 'Güncelle'}
        </button>
        <Link
          href="/admin/blog"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
