'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import type { FaqItem } from '@/types/faq';

export function HomeFaqSection({ faqs }: { faqs: FaqItem[] }) {
  const list = (faqs ?? [])
    .filter((f) => f.isActive)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));

  // Accordion should be independent per column (like the reference site):
  // opening a left item should not affect right column state and vice versa.
  const [openLeftId, setOpenLeftId] = useState<string | null>(null);
  const [openRightId, setOpenRightId] = useState<string | null>(null);

  if (!list.length) return null;

  const leftItems = list.filter((_, i) => i % 2 === 0);
  const rightItems = list.filter((_, i) => i % 2 === 1);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-900">Sıkça Sorulan Sorular</h2>
            <p className="mt-1 text-lg text-zinc-600">Sık sorulan soruları burada inceleyebilirsiniz</p>
          </div>
          <button type="button" className="text-lg font-medium text-zinc-500 hover:text-zinc-700">
            Tümünü keşfet
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {leftItems.map((item) => {
              const isOpen = openLeftId === item.id;
              return (
                <article key={item.id} className="rounded-xl border border-zinc-200 bg-white transition">
                  <button
                    type="button"
                    onClick={() => setOpenLeftId((prev) => (prev === item.id ? null : item.id))}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50"
                  >
                    <span className="text-lg font-medium text-zinc-900">{item.question}</span>
                    <Plus
                      className={`h-6 w-6 shrink-0 text-zinc-500 transition ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-200 bg-white px-5 py-4 text-base leading-relaxed text-zinc-600">
                      {item.answer}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="space-y-4">
            {rightItems.map((item) => {
              const isOpen = openRightId === item.id;
              return (
                <article key={item.id} className="rounded-xl border border-zinc-200 bg-white transition">
                  <button
                    type="button"
                    onClick={() => setOpenRightId((prev) => (prev === item.id ? null : item.id))}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50"
                  >
                    <span className="text-lg font-medium text-zinc-900">{item.question}</span>
                    <Plus
                      className={`h-6 w-6 shrink-0 text-zinc-500 transition ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-200 bg-white px-5 py-4 text-base leading-relaxed text-zinc-600">
                      {item.answer}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

