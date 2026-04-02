import { PaymentsService } from './payments.service';
import { PaymentStatus } from '../../entities/enums';

describe('PaymentsService transitions', () => {
  const service = new PaymentsService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    undefined,
  );

  it('allows expected payment transitions', () => {
    expect((service as any).isValidPaymentTransition(PaymentStatus.pending, PaymentStatus.processing)).toBe(true);
    expect((service as any).isValidPaymentTransition(PaymentStatus.processing, PaymentStatus.completed)).toBe(true);
    expect((service as any).isValidPaymentTransition(PaymentStatus.completed, PaymentStatus.refunded)).toBe(true);
    expect((service as any).isValidPaymentTransition(PaymentStatus.pending, PaymentStatus.pending)).toBe(true);
  });

  it('blocks invalid payment transitions', () => {
    expect((service as any).isValidPaymentTransition(PaymentStatus.pending, PaymentStatus.refunded)).toBe(false);
    expect((service as any).isValidPaymentTransition(PaymentStatus.completed, PaymentStatus.pending)).toBe(false);
    expect((service as any).isValidPaymentTransition(PaymentStatus.failed, PaymentStatus.completed)).toBe(false);
  });
});

