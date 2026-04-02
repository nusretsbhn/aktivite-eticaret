import type { Order } from '@/types/order';

/** Bilet PDF’i üretilebilir / gösterilebilir mi? */
export function isOrderTicketEligible(o: Order): boolean {
  if (o.status === 'cancelled') return false;
  if (o.paymentType === 'credit_card') return true;
  if (o.paymentType === 'transfer') return o.transferPaid === true;
  return false;
}
