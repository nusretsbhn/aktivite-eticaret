/** Kalkış ve varış saatlerine göre tur süresini saat cinsinden hesaplar (gece yarısı geçişi destekler). */
export function computeTripDurationHours(departureTime: string, arrivalTime: string): number {
  const parse = (t: string) => {
    const [h, m] = t.split(':').map((x) => Number(x));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const d = parse(departureTime);
  const a = parse(arrivalTime);
  if (d === null || a === null) return 0;
  let diffMin = a - d;
  if (diffMin < 0) diffMin += 24 * 60;
  return Math.round((diffMin / 60) * 100) / 100;
}
