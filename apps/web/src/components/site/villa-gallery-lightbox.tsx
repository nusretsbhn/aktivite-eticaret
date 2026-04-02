'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ImageItem = { id: string; url: string };

type Props = {
  images: ImageItem[];
  open: boolean;
  onClose: () => void;
  /** Dışarıdaki ana görsel ile senkron */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
};

export function VillaGalleryLightbox({
  images,
  open,
  onClose,
  activeIndex,
  onActiveIndexChange,
}: Props) {
  const [mounted, setMounted] = useState(false);

  const safeIndex = useMemo(
    () => Math.min(Math.max(0, activeIndex), Math.max(0, images.length - 1)),
    [activeIndex, images.length],
  );
  const current = images[safeIndex];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onActiveIndexChange(safeIndex <= 0 ? images.length - 1 : safeIndex - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onActiveIndexChange(safeIndex >= images.length - 1 ? 0 : safeIndex + 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, safeIndex, images.length, onActiveIndexChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    onActiveIndexChange(safeIndex <= 0 ? images.length - 1 : safeIndex - 1);
  }, [images.length, onActiveIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    onActiveIndexChange(safeIndex >= images.length - 1 ? 0 : safeIndex + 1);
  }, [images.length, onActiveIndexChange, safeIndex]);

  if (!mounted || !open || images.length === 0) return null;

  const modal = (
    <div className="fixed inset-0 z-[200]" role="presentation" aria-hidden={!open}>
      <button
        type="button"
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
        aria-label="Galeriyi kapat"
      />
      <div
        className="absolute inset-0 z-10 flex min-h-0 flex-col items-stretch p-3 sm:p-6 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="Galeri"
      >
        <div className="pointer-events-auto mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 text-white">
            <span className="text-sm font-medium tabular-nums">
              {safeIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Kapat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center">
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:-left-2"
                  aria-label="Önceki"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:-right-2"
                  aria-label="Sonraki"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}
            {current ? (
              <div className="flex h-full max-h-[min(78vh,900px)] w-full items-center justify-center px-10 sm:px-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex max-w-full shrink-0 justify-center gap-2 overflow-x-auto overflow-y-hidden pb-1 [-webkit-overflow-scrolling:touch]">
              {images.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onActiveIndexChange(i)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-24 ${
                    i === safeIndex ? 'border-teal-400 ring-2 ring-teal-300/50' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
