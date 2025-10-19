import { TYPE_SEAT_COLORS } from '@common/constants/seat.constant';

export function getTypeSeatColor(typeName: string): string {
  const colorMap: { [key: string]: string } = {
    Regular: TYPE_SEAT_COLORS.DELUXE,
    VIP: TYPE_SEAT_COLORS.VIP,
    Couple: TYPE_SEAT_COLORS.COUPLE,
    Premium: TYPE_SEAT_COLORS.PREMIUM,
    Standard: TYPE_SEAT_COLORS.STANDARD
  };

  return colorMap[typeName] || '#648ddb';
}
