import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../database/enums';

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.REQUESTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.IN_PROGRESS]: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

export function canTransitionBookingStatus(from: BookingStatus, to: BookingStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}

export function assertBookingStatusTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransitionBookingStatus(from, to)) {
    throw new BadRequestException(`Cannot change booking status from ${from} to ${to}`);
  }
}

