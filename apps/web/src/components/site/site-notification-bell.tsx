'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSiteAuth } from '@/components/site/site-auth-provider';
import type { UserNotification } from '@/types/notification';

const POLL_MS = 30_000;

export function SiteNotificationBell({
  buttonClassName,
}: {
  /** Varsayılan: beyaz arka planlı site stili */
  buttonClassName?: string;
}) {
  const { user, authReady } = useSiteAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const defaultBtn =
    'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white p-2 text-zinc-800 shadow-sm transition hover:bg-zinc-50';
  const btnClass = buttonClassName ?? defaultBtn;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/public/notifications', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { notifications?: UserNotification[]; unread?: number; error?: string };
      if (!res.ok) return;
      setItems(data.notifications ?? []);
      setUnread(typeof data.unread === 'number' ? data.unread : 0);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    if (!authReady || !user) return;
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [authReady, user, load]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      try {
        await fetch('/api/public/notifications', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAllRead: true }),
        });
        if (cancelled) return;
        const res = await fetch('/api/public/notifications', { credentials: 'include', cache: 'no-store' });
        const data = (await res.json()) as { notifications?: UserNotification[]; unread?: number };
        if (!cancelled && res.ok) {
          setItems(data.notifications ?? []);
          setUnread(typeof data.unread === 'number' ? data.unread : 0);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!authReady) {
    return <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-zinc-200/80" aria-hidden />;
  }

  if (!user) return null;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        className={`relative ${btnClass}`}
        aria-expanded={open}
        aria-label="Bildirimler"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[100] mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-200 bg-white py-2 text-zinc-900 shadow-xl">
          <p className="border-b border-zinc-100 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Bildirimler
          </p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-500">Bildirim yok.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-zinc-50 last:border-0">
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="block px-3 py-2.5 text-left hover:bg-zinc-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className={`block text-sm font-semibold ${!n.readAt ? 'text-zinc-900' : 'text-zinc-600'}`}>
                        {n.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{n.message}</span>
                    </Link>
                  ) : (
                    <div className="px-3 py-2.5">
                      <span className={`block text-sm font-semibold ${!n.readAt ? 'text-zinc-900' : 'text-zinc-600'}`}>
                        {n.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{n.message}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
