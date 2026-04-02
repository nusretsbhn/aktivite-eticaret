'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = { villaId: string };

export function VillaEditSubnav({ villaId }: Props) {
  const pathname = usePathname() ?? '';
  const base = `/admin/villalar/${villaId}`;
  const items: { href: string; label: string }[] = [
    { href: `${base}/duzenle`, label: 'Bilgiler' },
    { href: `${base}/galeri`, label: 'Galeri' },
    { href: `${base}/fiyat`, label: 'Fiyat takvimi' },
    { href: `${base}/musaitlik`, label: 'Müsaitlik' },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-700" aria-label="Villa düzenleme">
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={
              active
                ? 'rounded-lg bg-zinc-900 px-3 py-1.5 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
