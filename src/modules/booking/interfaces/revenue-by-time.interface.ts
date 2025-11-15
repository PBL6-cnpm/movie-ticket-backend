export interface RevenueByTimeDto {
  period: string; // '2024-01-15', '2024-01', 'Q1-2024', '2024'
  totalRevenue: number;
  totalBookings: number;
  totalSeats: number;
}
