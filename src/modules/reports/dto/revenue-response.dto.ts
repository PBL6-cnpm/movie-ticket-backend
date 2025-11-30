import { ApiProperty } from '@nestjs/swagger';

export class RevenueResponseDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty({ enum: ['day', 'week', 'month'] })
  period: 'day' | 'week' | 'month';

  constructor(partial: Partial<RevenueResponseDto>) {
    Object.assign(this, partial);
  }
}
