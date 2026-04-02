import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BlogForm } from '@/components/admin/blog-form';
import { readBlogPosts } from '@/lib/blog-server';

export default async function AdminBlogDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await readBlogPosts();
  const post = all.find((p) => p.id === id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Blog listesine dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Blog yazısını düzenle</h1>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <BlogForm mode="edit" post={post} />
      </div>
    </div>
  );
}
