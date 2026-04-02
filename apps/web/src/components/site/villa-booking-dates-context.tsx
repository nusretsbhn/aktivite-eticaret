'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { addDaysIso } from '@/lib/villa-booking-math';
import { todayIsoLocal } from '@/lib/villa-public-pricing';
import type { AdminVilla } from '@/types/admin-villa';

type Value = {
  villa: AdminVilla;
  checkIn: string;
  checkOut: string;
  setDates: (next: { checkIn: string; checkOut: string }) => void;
};

const VillaBookingDatesContext = createContext<Value | null>(null);

export function VillaBookingDatesProvider({ villa, children }: { villa: AdminVilla; children: ReactNode }) {
  const today = todayIsoLocal();
  const defaultOut = addDaysIso(today, Math.max(1, villa.minStayNights));
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(defaultOut);

  const setDates = useCallback((next: { checkIn: string; checkOut: string }) => {
    setCheckIn(next.checkIn);
    setCheckOut(next.checkOut);
  }, []);

  const value = useMemo(
    () => ({ villa, checkIn, checkOut, setDates }),
    [villa, checkIn, checkOut, setDates],
  );

  return <VillaBookingDatesContext.Provider value={value}>{children}</VillaBookingDatesContext.Provider>;
}

export function useVillaBookingDates(): Value {
  const ctx = useContext(VillaBookingDatesContext);
  if (!ctx) {
    throw new Error('useVillaBookingDates must be used within VillaBookingDatesProvider');
  }
  return ctx;
}
