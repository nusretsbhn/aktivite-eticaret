'use client';

import { CalendarRange } from 'lucide-react';

import { VillaBookingDateRangePicker } from '@/components/site/villa-booking-date-range-picker';
import { useVillaBookingDates } from '@/components/site/villa-booking-dates-context';

export function VillaAvailabilitySection() {
  const { villa, checkIn, checkOut, setDates } = useVillaBookingDates();

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
        <CalendarRange className="h-5 w-5 text-amber-700" aria-hidden />
        Uygunluk Durumu
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Takvimden giriş ve çıkış seçin; sağdaki rezervasyon kutusundaki tarihler ve fiyat özeti buna göre güncellenir.
      </p>
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <VillaBookingDateRangePicker villa={villa} checkIn={checkIn} checkOut={checkOut} onChange={setDates} />
      </div>
    </div>
  );
}
