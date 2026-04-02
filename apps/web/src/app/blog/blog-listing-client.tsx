'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { SiteFooter } from '@/components/site/site-footer';
import type { AdminSettings } from '@/types/admin-settings';
type PublicBlogSort = 'newest' | 'oldest' | 'title';

type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  createdAt: string;
};

function shortTitle(s: string, max = 72) {
  const t = String(s ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}...` : t;
}

function shortExcerpt(s: string, max = 140) {
  const t = String(s ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}...` : t;
}

export function BlogListingClient({ settings }: { settings: AdminSettings }) {
  const logoUrl = settings.siteManagement?.logoUrl?.trim() || '';

  const [sort, setSort] = useState<PublicBlogSort>('newest');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('sort', sort);
    if (debouncedQ) params.set('q', debouncedQ);
    params.set('page', '1');
    params.set('pageSize', '48');
    try {
      const res = await fetch(`/api/public/blog?${params.toString()}`, { cache: 'no-store' });
      const data = (await res.json()) as { posts?: PostCard[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-700 md:flex">
            <Link href="/aktiviteler" className="font-medium hover:text-zinc-900">
              Turlar
            </Link>
            <Link href="#" className="font-medium hover:text-zinc-900">
              Kampanyalar
            </Link>
            <Link href="/blog" className="font-semibold text-zinc-900">
              Blog
            </Link>
          </nav>
          <SiteAccountWithNotifications menuClassName="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">Blog</h1>
            <p className="mt-1 text-sm text-zinc-600">Deniz turları, rotalar ve ipuçları</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[320px] sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Yazılarda ara…"
                autoComplete="off"
                className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap sm:text-zinc-600">Sıralama</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as PublicBlogSort)}
                className="min-h-9 flex-1 cursor-pointer border-0 bg-transparent py-1 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-0"
              >
                <option value="newest">En yeni</option>
                <option value="oldest">En eski</option>
                <option value="title">Başlığa göre (A-Z)</option>
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {loading && <p className="text-center text-sm text-zinc-500">Yükleniyor…</p>}

        {!loading && !error && posts.length === 0 && (
          <p className="text-center text-zinc-500">Henüz yayında blog yazısı yok.</p>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {posts.map((p) => (
              <article
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link href={`/blog/${p.slug}`} className="block shrink-0">
                  {p.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImageUrl}
                      alt=""
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400">
                      Görsel yok
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/blog/${p.slug}`}>
                    <h2 className="line-clamp-2 text-base font-bold leading-snug text-zinc-900">{shortTitle(p.title)}</h2>
                  </Link>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-500">{shortExcerpt(p.excerpt)}</p>
                  <div className="mt-4 flex justify-center">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline"
                    >
                      Devamını gör
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <SiteFooter socialMedia={settings.socialMedia} footerManagement={settings.footerManagement} />
    </div>
  );
}
