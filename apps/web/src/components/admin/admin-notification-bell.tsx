'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { AdminNotification } from '@/types/notification';

export function AdminNotificationBell({
  totalUnread,
  onMarkedRead,
}: {
  totalUnread: number;
  onMarkedRead: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { notifications?: AdminNotification[]; error?: string };
      if (res.ok) setItems(data.notifications ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      await loadList();
      try {
        await fetch('/api/admin/notifications', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAllRead: true }),
        });
        if (!cancelled) {
          await onMarkedRead();
          await loadList();
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadList, onMarkedRead]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function hrefFor(n: AdminNotification) {
    if (n.type === 'cancel_request') return '/admin/siparisler/iptal-iade';
    return '/admin/siparisler';
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white p-2 text-zinc-800 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        aria-expanded={open}
        aria-label="Bildirimler"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-200 bg-white py-2 text-zinc-900 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <p className="border-b border-zinc-100 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Bildirimler
          </p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">Bildirim yok.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800">
                  <Link
                    href={hrefFor(n)}
                    className="block px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    onClick={() => setOpen(false)}
                  >
                    <span className="block text-xs font-medium uppercase text-zinc-400">
                      {n.type === 'new_order' ? 'Yeni sipariş' : 'İptal / iade'}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</span>
                    <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">{n.message}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
