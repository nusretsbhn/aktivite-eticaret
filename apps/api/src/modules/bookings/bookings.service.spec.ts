import { BookingsService } from './bookings.service';
import { BookingStatus } from '../../entities/enums';

describe('BookingsService transitions', () => {
  const service = new BookingsService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  it('allows expected transitions', () => {
    expect(service.canTransitionStatus(BookingStatus.pending, BookingStatus.confirmed)).toBe(true);
    expect(service.canTransitionStatus(BookingStatus.confirmed, BookingStatus.completed)).toBe(true);
    expect(service.canTransitionStatus(BookingStatus.completed, BookingStatus.refunded)).toBe(true);
    expect(service.canTransitionStatus(BookingStatus.pending, BookingStatus.pending)).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(service.canTransitionStatus(BookingStatus.cancelled, BookingStatus.pending)).toBe(false);
    expect(service.canTransitionStatus(BookingStatus.refunded, BookingStatus.confirmed)).toBe(false);
    expect(service.canTransitionStatus(BookingStatus.completed, BookingStatus.pending)).toBe(false);
  });
});

