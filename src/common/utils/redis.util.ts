import { REDIS_KEYS } from '@common/constants';

export function generateSeatLockKey(showtimeId: string, seatId: string): string {
  return REDIS_KEYS.LOCK_SEAT(showtimeId, seatId);
}
