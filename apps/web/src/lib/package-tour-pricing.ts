import type { PackageTourPriceRule } from '@/types/admin-package-tour';

export function roundToFiveHundreds(value: number, mode: 'up' | 'down'): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const step = 500;
  return mode === 'down' ? Math.floor(value / step) * step : Math.ceil(value / step) * step;
}

type FormulaInput = Pick<PackageTourPriceRule, 'costPrice' | 'profitPercent' | 'roundingMode'> & {
  nights?: number;
  activityTotal?: number;
};

function toProfitMultiplier(profitPercent: number): number {
  return 1 + Math.max(0, Number(profitPercent) || 0) / 100;
}

/**
 * ((Günlük otel maliyeti * gece sayısı) + (aktivite fiyatları toplamı)) * kar oranı
 * ardından 500'e yuvarlama.
 */
export function computeRuleAdultPrice(rule: FormulaInput): number {
  const nights = Math.max(1, Number(rule.nights) || 1);
  const activityTotal = Math.max(0, Number(rule.activityTotal) || 0);
  const hotelTotal = Math.max(0, Number(rule.costPrice) || 0) * nights;
  const base = (hotelTotal + activityTotal) * toProfitMultiplier(Number(rule.profitPercent) || 0);
  return roundToFiveHundreds(base, rule.roundingMode);
}

export function computeRuleSinglePrice(
  rule: FormulaInput & Pick<PackageTourPriceRule, 'singleRoomMultiplier'>,
): number {
  const nights = Math.max(1, Number(rule.nights) || 1);
  const activityTotal = Math.max(0, Number(rule.activityTotal) || 0);
  const singleMul = Math.max(1, Number(rule.singleRoomMultiplier) || 1);
  const hotelTotal = Math.max(0, Number(rule.costPrice) || 0) * nights * singleMul;
  const base = (hotelTotal + activityTotal) * toProfitMultiplier(Number(rule.profitPercent) || 0);
  return roundToFiveHundreds(base, rule.roundingMode);
}

export function computeChildPrice(adultPrice: number, percent: number): number {
  const p = Math.max(0, Number(percent) || 0);
  return roundToFiveHundreds((adultPrice * p) / 100, 'up');
}

export function computeDiscountedFromAdult(adultPrice: number, discountPercent: number): number {
  const d = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  return roundToFiveHundreds(adultPrice * (1 - d / 100), 'up');
}

