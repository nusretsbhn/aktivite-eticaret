'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { VillaBookingDateRangePicker } from '@/components/site/villa-booking-date-range-picker';
import type { AdminVilla } from '@/types/admin-villa';

type Props = {
  villa: AdminVilla;
  checkIn: string;
  checkOut: string;
  open: boolean;
  onClose: () => void;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
};

export function VillaBookingDateRangeModal({ villa, checkIn, checkOut, open, onClose, onChange }: Props) {
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

  const modal = (
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
        <VillaBookingDateRangePicker
          villa={villa}
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={onChange}
          closeOnComplete
          onComplete={onClose}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
