import Link from 'next/link';
import { Ticket, TicketX } from 'lucide-react';

const ACTIONS = [
  { id: 'ticket-search', label: 'Bilet Sorgula', icon: Ticket, href: '/bilet-sorgula' },
  { id: 'ticket-cancel', label: 'Bilet İptal Talebi', icon: TicketX, href: '/bilet-iptal-talebi' },
];

/** @siteProduct SITE_PRODUCT_ACTIVITY — bilet / yardım kısayolları */
export function HomeActionsWidget() {
  return (
    <section className="bg-gradient-to-b from-sky-900 via-blue-900 to-indigo-900">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-lg backdrop-blur">
          <div className="grid grid-cols-1 divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex min-h-[96px] items-center justify-center gap-3 px-4 py-5 text-zinc-800 transition hover:bg-sky-50"
                >
                  <span className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-600 transition group-hover:border-sky-200 group-hover:text-sky-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-medium tracking-tight md:text-xl">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

