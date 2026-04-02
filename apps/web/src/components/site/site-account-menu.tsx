'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { useSiteAuth } from '@/components/site/site-auth-provider';

type Variant = 'site' | 'hero-inverse';

export function SiteAccountMenu({
  className,
  variant = 'site',
}: {
  className: string;
  variant?: Variant;
}) {
  const { user, authReady, openAuth, logout } = useSiteAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  if (!authReady) {
    const sk =
      variant === 'hero-inverse'
        ? 'min-h-10 min-w-[118px] rounded-lg bg-white/15 animate-pulse'
        : 'min-h-10 min-w-[118px] rounded-lg bg-zinc-200/80 animate-pulse';
    return <div className={sk} aria-hidden />;
  }

  if (!user) {
    return (
      <button type="button" onClick={() => openAuth()} className={className}>
        Giriş Yap
      </button>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className={`inline-flex min-h-10 items-center gap-1.5 ${className}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        Hesabım
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 z-[100] mt-2 min-w-[220px] rounded-xl border border-zinc-200 bg-white py-1 text-zinc-900 shadow-xl"
          role="menu"
        >
          <Link
            href="/hesap"
            role="menuitem"
            className="block px-4 py-2.5 text-sm font-medium hover:bg-zinc-100"
            onClick={() => setMenuOpen(false)}
          >
            Hesap Bilgileri
          </Link>
          <Link
            href="/hesap/siparisler"
            role="menuitem"
            className="block px-4 py-2.5 text-sm font-medium hover:bg-zinc-100"
            onClick={() => setMenuOpen(false)}
          >
            Siparişler
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => {
              setMenuOpen(false);
              void logout();
            }}
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
