'use client';

import { useEffect, useState, type RefObject } from 'react';

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type SiteDatePickerOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: RefObject<HTMLElement | null>;
  /** YYYY-MM-DD veya null */
  value: string | null;
  onConfirm: (next: string | null) => void;
  /** false: "Temizle" gizlenir, yalnızca tarih seçimi */
  allowClear?: boolean;
};

export function SiteDatePickerOverlay({
  open,
  onOpenChange,
  anchorRef,
  value,
  onConfirm,
  allowClear = true,
}: SiteDatePickerOverlayProps) {
  const [dateCursor, setDateCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [tempDateIso, setTempDateIso] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const iso = value;
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m] = iso.split('-').map(Number);
      setDateCursor(new Date(y, m - 1, 1));
      setTempDateIso(iso);
    } else {
      setTempDateIso(null);
      const d = new Date();
      setDateCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const btn = anchorRef.current;
    if (!btn) return;

    const calc = () => {
      const rect = btn.getBoundingClientRect();
      const w = 380;
      const margin = 12;
      const left = clamp(rect.left, margin, window.innerWidth - w - margin);
      const top = rect.bottom + 10;
      setPopoverPos({ top, left, width: w });
    };

    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('scroll', calc, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  function confirm() {
    let next: string | null = tempDateIso;
    if (!allowClear && !next && value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      next = value;
    }
    onConfirm(next);
    onOpenChange(false);
  }

  const calendarBody = (
    <>
      <div className="flex items-center justify-end gap-1 px-4 pb-2 md:gap-1">
        <button
          type="button"
          className="rounded-lg p-2 text-blue-600 hover:bg-zinc-100"
          aria-label="Önceki ay"
          onClick={() => setDateCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-blue-600 hover:bg-zinc-100"
          aria-label="Sonraki ay"
          onClick={() => setDateCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className="px-4 pb-4 md:pb-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-500 md:text-[11px]">
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => (
            <div key={d} className="py-1.5 md:py-1.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const y = dateCursor.getFullYear();
            const m = dateCursor.getMonth();
            const dim = daysInMonth(y, m);
            const firstDow = new Date(y, m, 1).getDay();
            const pad = (firstDow + 6) % 7;
            const cells: (number | null)[] = [];
            for (let i = 0; i < pad; i++) cells.push(null);
            for (let d = 1; d <= dim; d++) cells.push(d);
            const selected = tempDateIso;
            return cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="h-9 w-9 md:h-9 md:w-9" />;
              const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSel = selected === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setTempDateIso(iso)}
                  className={`h-9 w-9 rounded-full text-sm font-medium transition md:h-9 md:w-9 ${
                    isSel ? 'bg-blue-600 text-white' : 'text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  {day}
                </button>
              );
            });
          })()}
        </div>
      </div>
    </>
  );

  const headerRow = (mobile: boolean) => (
    <div className="flex items-center justify-between px-4 py-3">
      {allowClear ? (
        <button
          type="button"
          className={`font-medium text-zinc-600 hover:text-zinc-900 ${mobile ? 'text-sm' : 'text-sm'}`}
          onClick={() => setTempDateIso(null)}
        >
          Temizle
        </button>
      ) : (
        <span className="w-14" aria-hidden />
      )}
      <p className={`font-semibold ${mobile ? 'text-base' : 'text-sm'}`}>
        {dateCursor.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
      </p>
      <button
        type="button"
        className={`rounded-lg bg-blue-600 font-semibold text-white ${mobile ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-sm'}`}
        onClick={confirm}
      >
        Tamam
      </button>
    </div>
  );

  return (
    <>
      {open && popoverPos && (
        <div className="fixed inset-0 z-50 hidden md:block">
          <button type="button" aria-label="Kapat" className="absolute inset-0" onClick={() => onOpenChange(false)} />
          <div
            className="absolute rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl"
            style={{ top: popoverPos.top, left: popoverPos.left, width: popoverPos.width }}
          >
            {headerRow(false)}
            {calendarBody}
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/45"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl rounded-t-2xl bg-white text-zinc-900 shadow-2xl">
            {headerRow(true)}
            <div className="flex items-center justify-end gap-2 px-4 pb-2">
              <button
                type="button"
                className="rounded-lg p-2 text-blue-600 hover:bg-zinc-100"
                aria-label="Önceki ay"
                onClick={() => setDateCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-blue-600 hover:bg-zinc-100"
                aria-label="Sonraki ay"
                onClick={() => setDateCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
            <div className="px-4 pb-5">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const y = dateCursor.getFullYear();
                  const m = dateCursor.getMonth();
                  const dim = daysInMonth(y, m);
                  const firstDow = new Date(y, m, 1).getDay();
                  const pad = (firstDow + 6) % 7;
                  const cells: (number | null)[] = [];
                  for (let i = 0; i < pad; i++) cells.push(null);
                  for (let d = 1; d <= dim; d++) cells.push(d);
                  const selected = tempDateIso;
                  return cells.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} className="aspect-square" />;
                    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSel = selected === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setTempDateIso(iso)}
                        className={`aspect-square rounded-full text-sm font-medium transition ${
                          isSel ? 'bg-blue-600 text-white' : 'text-zinc-800 hover:bg-zinc-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
