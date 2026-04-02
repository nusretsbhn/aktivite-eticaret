import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { SiteFooter } from '@/components/site/site-footer';
import { readBlogPosts } from '@/lib/blog-server';
import { readSettings } from '@/lib/admin-settings-server';

function splitLead(body: string): { lead: string; rest: string } {
  const raw = String(body ?? '');
  const parts = raw.split(/\n\n+/);
  const lead = (parts[0] ?? '').trim();
  const rest = parts.slice(1).join('\n\n').trim();
  return { lead, rest };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [all, settings] = await Promise.all([readBlogPosts(), readSettings()]);
  const post = all.find((p) => p.slug === slug && p.isActive);
  if (!post) notFound();

  const logoUrl = settings.siteManagement?.logoUrl?.trim() || '';
  const { lead, rest } = splitLead(post.body);
  const restBlocks = rest ? rest.split(/\n\n+/).filter(Boolean) : [];

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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <nav className="mb-6 text-xs text-zinc-500 sm:text-sm" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-zinc-800">
                Ana Sayfa
              </Link>
            </li>
            <li aria-hidden className="text-zinc-400">
              &gt;
            </li>
            <li>
              <Link href="/blog" className="hover:text-zinc-800">
                Blog
              </Link>
            </li>
            <li aria-hidden className="text-zinc-400">
              &gt;
            </li>
            <li className="line-clamp-2 text-zinc-600">{post.title}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl sm:leading-tight">{post.title}</h1>

        {post.coverImageUrl ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImageUrl} alt="" className="w-full object-cover" />
          </div>
        ) : null}

        <article className="mt-10 space-y-6 text-zinc-800">
          {lead ? (
            <p className="border-l-4 border-zinc-200 pl-5 text-base italic leading-relaxed text-zinc-700 sm:text-lg">
              {lead}
            </p>
          ) : null}

          {restBlocks.map((block, i) => (
            <p key={i} className="whitespace-pre-wrap text-base leading-relaxed text-zinc-700 sm:text-lg">
              {block}
            </p>
          ))}
        </article>
      </main>

      <SiteFooter socialMedia={settings.socialMedia} footerManagement={settings.footerManagement} />
    </div>
  );
}
