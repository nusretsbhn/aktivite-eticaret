'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { VillaSearchDateRangePicker } from '@/components/site/villa-search-date-range-picker';

type Props = {
  checkIn: string;
  checkOut: string;
  open: boolean;
  onClose: () => void;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
};

export function VillaSearchDateRangeModal({ checkIn, checkOut, open, onClose, onChange }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Giriş ve çıkış tarihi"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <VillaSearchDateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={onChange} minNights={1} />
        <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1D61FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
