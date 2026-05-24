import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../database/enums';
import { assertBookingStatusTransition, canTransitionBookingStatus } from './booking-status';

describe('booking status transitions', () => {
  it('allows expected forward transitions', () => {
    expect(canTransitionBookingStatus(BookingStatus.REQUESTED, BookingStatus.CONFIRMED)).toBe(true);
    expect(canTransitionBookingStatus(BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS)).toBe(true);
    expect(canTransitionBookingStatus(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED)).toBe(true);
    expect(canTransitionBookingStatus(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.COMPLETED, BookingStatus.CONFIRMED),
    ).toThrow(BadRequestException);
    expect(() =>
      assertBookingStatusTransition(BookingStatus.CANCELLED, BookingStatus.REQUESTED),
    ).toThrow(BadRequestException);
  });
});

