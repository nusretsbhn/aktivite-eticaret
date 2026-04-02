'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { getAvailabilityForDate } from '@/lib/availability-helpers';
import { addDaysIso } from '@/lib/villa-booking-math';
import {
  findFirstValidVillaCheckOut,
  findValidVillaCheckOutFrom,
  hasValidVillaCheckoutOnOrAfter,
  listAllValidVillaCheckouts,
} from '@/lib/villa-stay-availability';
import { currencySymbol, getNightlyPriceForDate, todayIsoLocal } from '@/lib/villa-public-pricing';
import type { AdminVilla } from '@/types/admin-villa';

const WEEK_LETTERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'] as const;

type CellVisual = 'ok' | 'full' | 'maintenance' | 'noPrice';

type FullDayEdgeRole = 'middle' | 'checkout_edge' | 'checkin_edge';

function isFullDay(villa: AdminVilla, iso: string): boolean {
  return getAvailabilityForDate(villa, iso) === 'full';
}

function fullDayEdgeRole(villa: AdminVilla, iso: string): FullDayEdgeRole | null {
  if (!isFullDay(villa, iso)) return null;
  const prevFull = isFullDay(villa, addDaysIso(iso, -1));
  const nextFull = isFullDay(villa, addDaysIso(iso, 1));
  const firstInRun = !prevFull;
  const lastInRun = !nextFull;

  if (firstInRun && lastInRun) {
    return getNightlyPriceForDate(villa, iso) !== null ? 'checkin_edge' : 'checkout_edge';
  }
  if (firstInRun && !lastInRun) return 'checkout_edge';
  if (lastInRun && !firstInRun) return 'checkin_edge';
  return 'middle';
}

function isoFromYmd(y: number, m0: number, day: number): string {
  return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [a, b, c] = iso.split('-').map(Number);
  return { y: a, m: b - 1, d: c };
}

function monthMatrix(year: number, month0: number): ({ iso: string } | null)[][] {
  const first = new Date(year, month0, 1);
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const mondayPad = (first.getDay() + 6) % 7;
  const flat: ({ iso: string } | null)[] = [];
  for (let i = 0; i < mondayPad; i++) flat.push(null);
  for (let d = 1; d <= lastDay; d++) flat.push({ iso: isoFromYmd(year, month0, d) });
  while (flat.length % 7 !== 0) flat.push(null);
  while (flat.length < 42) flat.push(null);
  const rows: ({ iso: string } | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
  return rows;
}

function cellVisual(villa: AdminVilla, iso: string): CellVisual {
  const price = getNightlyPriceForDate(villa, iso);
  const av = getAvailabilityForDate(villa, iso);
  if (av === 'full') return 'full';
  if (av === 'maintenance') return 'maintenance';
  if (price === null) return 'noPrice';
  return 'ok';
}

export type VillaBookingDateRangePickerProps = {
  villa: AdminVilla;
  checkIn: string;
  checkOut: string;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
  /** Modal: seçimden sonra kapanır */
  closeOnComplete?: boolean;
  onComplete?: () => void;
  className?: string;
};

export function VillaBookingDateRangePicker({
  villa,
  checkIn,
  checkOut,
  onChange,
  closeOnComplete = false,
  onComplete,
  className = '',
}: VillaBookingDateRangePickerProps) {
  const today = todayIsoLocal();

  const initialLeft = useMemo(() => {
    const { y, m } = parseIso(checkIn);
    return { y, m };
  }, [checkIn]);

  const [view, setView] = useState(() => ({ y: initialLeft.y, m: initialLeft.m }));
  const [pickPhase, setPickPhase] = useState<'check_in' | 'check_out'>('check_in');
  const [pendingCheckIn, setPendingCheckIn] = useState<string | null>(null);

  useEffect(() => {
    const { y, m } = parseIso(checkIn);
    setView({ y, m });
    setPickPhase('check_in');
    setPendingCheckIn(null);
  }, [checkIn, checkOut]);

  const goPrevMonth = useCallback(() => {
    setView(({ y, m }) => (m <= 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  }, []);

  const goNextMonth = useCallback(() => {
    setView(({ y, m }) => (m >= 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  }, []);

  const fmtCompact = useCallback(
    (n: number) => {
      const sym = currencySymbol(villa.paymentCurrency);
      const num = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
      return `${num} ${sym}`;
    },
    [villa.paymentCurrency],
  );

  const sortedValidCheckouts = useMemo(() => {
    if (pickPhase !== 'check_out' || !pendingCheckIn) return null;
    return listAllValidVillaCheckouts(villa, pendingCheckIn);
  }, [villa, pickPhase, pendingCheckIn]);

  const isDayDisabled = useCallback(
    (iso: string) => {
      if (iso < today) return true;
      if (getAvailabilityForDate(villa, iso) === 'maintenance') return true;

      if (pickPhase === 'check_in' || (pickPhase === 'check_out' && pendingCheckIn && iso <= pendingCheckIn)) {
        return getNightlyPriceForDate(villa, iso) === null;
      }

      if (pickPhase === 'check_out' && pendingCheckIn && iso > pendingCheckIn) {
        if (!sortedValidCheckouts?.length) return true;
        return !hasValidVillaCheckoutOnOrAfter(sortedValidCheckouts, iso);
      }

      return true;
    },
    [villa, today, pickPhase, pendingCheckIn, sortedValidCheckouts],
  );

  const handleDayClick = useCallback(
    (iso: string) => {
      if (iso < today) return;
      if (getAvailabilityForDate(villa, iso) === 'maintenance') return;

      if (pickPhase === 'check_in') {
        if (getNightlyPriceForDate(villa, iso) === null) return;
        setPendingCheckIn(iso);
        setPickPhase('check_out');
        return;
      }

      const start = pendingCheckIn;
      if (!start) {
        setPickPhase('check_in');
        return;
      }

      if (iso <= start) {
        if (getNightlyPriceForDate(villa, iso) === null) return;
        setPendingCheckIn(iso);
        return;
      }

      const out = findValidVillaCheckOutFrom(villa, start, iso);
      if (!out) return;

      onChange({ checkIn: start, checkOut: out });
      setPickPhase('check_in');
      setPendingCheckIn(null);
      if (closeOnComplete) onComplete?.();
    },
    [villa, today, pickPhase, pendingCheckIn, onChange, closeOnComplete, onComplete],
  );

  const clearDates = useCallback(() => {
    const t = todayIsoLocal();
    const out = findFirstValidVillaCheckOut(villa, t);
    if (!out) return;
    onChange({ checkIn: t, checkOut: out });
    setPickPhase('check_in');
    setPendingCheckIn(null);
  }, [villa, onChange]);

  const rangeClass = useCallback(
    (iso: string): 'none' | 'start' | 'middle' | 'end' => {
      if (pickPhase === 'check_out' && pendingCheckIn) {
        if (iso === pendingCheckIn) return 'start';
        return 'none';
      }
      if (iso < checkIn || iso > checkOut) return 'none';
      if (iso === checkIn && iso === checkOut) return 'middle';
      if (iso === checkIn) return 'start';
      if (iso === checkOut) return 'end';
      return 'middle';
    },
    [checkIn, checkOut, pickPhase, pendingCheckIn],
  );

  const { y: viewY, m: viewM } = view;
  const rightY = viewM === 11 ? viewY + 1 : viewY;
  const rightM = viewM === 11 ? 0 : viewM + 1;

  const leftTitle = new Date(viewY, viewM, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const rightTitle = new Date(rightY, rightM, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const leftRows = monthMatrix(viewY, viewM);
  const rightRows = monthMatrix(rightY, rightM);

  const renderMonth = (rows: ({ iso: string } | null)[][], side: 'left' | 'right') => (
    <div className="min-w-0 flex-1">
      <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-zinc-400">
        {WEEK_LETTERS.map((l, i) => (
          <span key={`${side}-w-${i}`}>{l}</span>
        ))}
      </div>
      <div className="space-y-0.5">
        {rows.map((week, wi) => (
          <div key={`${side}-wrow-${wi}`} className="grid grid-cols-7 gap-0.5">
            {week.map((cell, di) => {
              if (!cell) return <div key={`${side}-${wi}-${di}-e`} className="min-h-[52px]" />;
              const iso = cell.iso;
              const { d } = parseIso(iso);

              const vis = cellVisual(villa, iso);
              const price = getNightlyPriceForDate(villa, iso);
              const disabled = isDayDisabled(iso);
              const fullEdge = vis === 'full' ? fullDayEdgeRole(villa, iso) : null;

              const rc = rangeClass(iso);

              let base = 'bg-sky-100 text-teal-800';
              if (vis === 'maintenance') {
                base = 'bg-orange-100 text-orange-900';
              } else if (vis === 'noPrice') {
                base = 'bg-zinc-100 text-zinc-400';
              } else if (vis === 'full' && fullEdge === 'middle') {
                base = 'bg-zinc-200 text-zinc-600';
              } else if (vis === 'full' && fullEdge === 'checkout_edge') {
                base = 'bg-sky-200 text-teal-900';
              } else if (vis === 'full' && fullEdge === 'checkin_edge') {
                base =
                  'bg-[linear-gradient(to_top_right,rgb(228_228_231)_48%,rgb(186_230_253)_48%)] text-teal-900';
              }

              let rangeStyle = '';
              if (!disabled && rc !== 'none') {
                if (rc === 'middle') rangeStyle = 'bg-sky-300/90 ring-1 ring-sky-400/40';
                if (rc === 'start')
                  rangeStyle =
                    'bg-[linear-gradient(to_top_right,white_48%,rgb(125_211_252)_48%)] text-teal-900 ring-1 ring-sky-400/30';
                if (rc === 'end')
                  rangeStyle =
                    'bg-[linear-gradient(to_top_right,rgb(125_211_252)_48%,white_48%)] text-teal-900 ring-1 ring-sky-400/30';
              }

              const showPrice =
                price != null && (vis === 'ok' || (vis === 'full' && fullEdge === 'checkin_edge'));

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(iso)}
                  className={`flex min-h-[52px] flex-col items-center justify-start rounded-lg px-0.5 py-1 text-[11px] font-semibold transition ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:brightness-95'} ${rangeStyle || base}`}
                >
                  <span className="tabular-nums leading-none">{d}</span>
                  {showPrice ? (
                    <span className="mt-0.5 line-clamp-2 max-w-full text-[9px] font-medium leading-tight text-teal-800 opacity-95">
                      {fmtCompact(price)}
                    </span>
                  ) : (
                    <span className="mt-0.5 min-h-[14px] text-[9px] opacity-70"> </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <p className="mb-3 text-center text-xs text-zinc-500">
        {pickPhase === 'check_in' ? 'Önce giriş tarihini seçin' : 'Şimdi çıkış tarihini seçin'}
      </p>

      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrevMonth}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          aria-label="Önceki ay"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 justify-center gap-4 text-sm font-semibold capitalize text-zinc-900 sm:gap-12 sm:text-base">
          <span className="truncate text-center">{leftTitle}</span>
          <span className="hidden truncate text-center sm:inline">{rightTitle}</span>
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          aria-label="Sonraki ay"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
        {renderMonth(leftRows, 'left')}
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-center text-sm font-semibold capitalize text-zinc-900 sm:hidden">{rightTitle}</p>
          {renderMonth(rightRows, 'right')}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-zinc-300" /> Dolu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-orange-200" /> Opsiyonlu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-sky-100 ring-1 ring-sky-200/80" /> Müsait
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-sky-200" /> Çıkış uygun
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-3 w-4 shrink-0 rounded-sm bg-[linear-gradient(to_top_right,rgb(228_228_231)_48%,rgb(186_230_253)_48%)]"
              aria-hidden
            />
            Giriş uygun
          </span>
        </div>
        <button type="button" onClick={clearDates} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Tarihi temizle
        </button>
      </div>
    </div>
  );
}
