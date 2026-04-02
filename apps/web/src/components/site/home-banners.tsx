'use client';

import { useEffect, useMemo, useState } from 'react';

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  const m = i % len;
  return m < 0 ? m + len : m;
}

export function HomeBanners({
  sliderBanners,
  rightBanner,
}: {
  sliderBanners: {
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    ctaText?: string;
  }[];
  rightBanner?: {
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    storeBadges?: {
      googlePlayUrl?: string;
      appStoreUrl?: string;
    };
  };
}) {
  const left = sliderBanners ?? [];
  const right = rightBanner;

  if (!left.length && !right) return null;

  const slides = useMemo(() => left.filter((x) => x && (x.title || x.subtitle || x.imageUrl)), [left]);
  const [idx, setIdx] = useState(0);
  const safeIdx = clampIndex(idx, slides.length);

  useEffect(() => {
    setIdx(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => setIdx((p) => p + 1), 6500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {slides.length ? (
            <div className="relative">
              <div className="relative h-[240px] w-full overflow-hidden sm:h-[280px]">
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
                  style={{ transform: `translateX(-${safeIdx * 100}%)` }}
                >
                  {slides.map((s) => (
                    <div key={s.id} className="relative h-full w-full shrink-0">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                          Görsel yok
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {slides.length > 1 && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    {slides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Banner ${i + 1}`}
                        onClick={() => setIdx(i)}
                        className={[
                          'h-2 w-2 rounded-full transition',
                          i === safeIdx ? 'bg-white' : 'bg-white/40 hover:bg-white/70',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Önceki"
                      onClick={() => setIdx((p) => p - 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/20 text-white shadow-sm backdrop-blur hover:bg-black/30"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Sonraki"
                      onClick={() => setIdx((p) => p + 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/20 text-white shadow-sm backdrop-blur hover:bg-black/30"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-sm text-zinc-500 dark:text-zinc-400">Banner eklenmedi.</div>
          )}
        </div>

        {right && (right.title || right.subtitle || right.imageUrl) ? (
          <aside className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-[#FFF3D8] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {right.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={right.imageUrl}
                alt={right.title ?? 'Banner'}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}

            <div className="relative grid min-h-[240px] p-5 sm:min-h-[280px]">
              <div className="max-w-[75%]">
                {!!right.title && (
                  <p className="text-2xl font-extrabold leading-tight text-zinc-900 drop-shadow-sm dark:text-zinc-50">
                    {right.title}
                  </p>
                )}
                {!!right.subtitle && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-800 drop-shadow-sm dark:text-zinc-200">
                    {right.subtitle}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {right.storeBadges?.googlePlayUrl && (
                    <a
                      href={right.storeBadges.googlePlayUrl}
                      className="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white/90 px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-50 dark:hover:bg-zinc-950/90"
                    >
                      Google Play
                    </a>
                  )}
                  {right.storeBadges?.appStoreUrl && (
                    <a
                      href={right.storeBadges.appStoreUrl}
                      className="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white/90 px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-50 dark:hover:bg-zinc-950/90"
                    >
                      App Store
                    </a>
                  )}
                </div>
              </div>

              {!right.imageUrl && (
                <div className="mt-4 flex min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Görsel yok
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

