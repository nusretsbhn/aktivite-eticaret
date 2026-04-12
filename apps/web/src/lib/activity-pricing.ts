import type { PriceEntry } from '@/types/admin-activity';

/** Tarih satırından yetişkin / çocuk / bebek birim fiyatları (eksikse yetişkin fiyatına düşer). */
export function resolveActivityPrices(p: PriceEntry | undefined): { adult: number; child: number; infant: number } {
  if (!p || typeof p.price !== 'number' || !Number.isFinite(p.price)) {
    return { adult: 0, child: 0, infant: 0 };
  }
  const adult = p.price;
  const child = typeof p.priceChild === 'number' && Number.isFinite(p.priceChild) ? p.priceChild : adult;
  const infant = typeof p.priceInfant === 'number' && Number.isFinite(p.priceInfant) ? p.priceInfant : adult;
  return { adult, child, infant };
}

export function computeActivityBookingTotal(
  p: PriceEntry | undefined,
  adults: number,
  children: number,
  infants: number,
): number {
  const { adult, child, infant } = resolveActivityPrices(p);
  const a = Math.max(0, adults);
  const c = Math.max(0, children);
  const i = Math.max(0, infants);
  return a * adult + c * child + i * infant;
}
