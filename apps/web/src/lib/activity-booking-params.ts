/** URL/searchParams: yetişkin/çocuk/bebek veya yalnızca `people` (eski linkler). */
export function parseActivityGuestParams(sp: Record<string, string | string[] | undefined>): {
  adults: number;
  children: number;
  infants: number;
} {
  const str = (k: string) => (typeof sp[k] === 'string' ? sp[k] : undefined);
  const hasTriple =
    str('adults') !== undefined || str('children') !== undefined || str('infants') !== undefined;
  if (hasTriple) {
    const adults = Math.max(1, Math.floor(Number(str('adults') ?? '1') || 1));
    const children = Math.max(0, Math.floor(Number(str('children') ?? '0') || 0));
    const infants = Math.max(0, Math.floor(Number(str('infants') ?? '0') || 0));
    return { adults, children, infants };
  }
  const people = Math.max(1, Math.floor(Number(str('people') ?? '1') || 1));
  return { adults: people, children: 0, infants: 0 };
}
