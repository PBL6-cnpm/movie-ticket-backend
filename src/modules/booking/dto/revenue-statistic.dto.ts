import { TimeGroupBy } from '@common/enums/booking.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { RevenueByMovie } from '../interfaces/revenue-by-movie.interface';

export class RevenueStatsQueryDto {
  @ApiProperty({ required: false, description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Branch ID to filter' })
  @IsNotEmpty()
  @IsUUID()
  branchId?: string;

  @ApiProperty({
    enum: TimeGroupBy,
    required: false,
    description: 'Time period grouping',
    default: TimeGroupBy.DAY
  })
  @IsOptional()
  @IsEnum(TimeGroupBy)
  timePeriod?: TimeGroupBy;
}

export class BranchRevenueStatsDto {
  @ApiProperty()
  branchId: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  branchAddress: string;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  totalTicketsSold: number;

  @ApiProperty()
  totalRefreshmentsRevenue: number;

  @ApiProperty()
  averageTicketPrice: number;
}

export class RevenueGroupItemDto {
  @ApiProperty()
  period: string; // day / month / quarter / year

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  ticketsSold: number;

  @ApiProperty()
  refreshmentsRevenue: number;
}

export class SingleBranchRevenueDto extends BranchRevenueStatsDto {
  @ApiProperty({
    description: 'Revenue grouped by selected time period',
    type: () => [RevenueGroupItemDto]
  })
  revenueByPeriod?: RevenueGroupItemDto[];

  @ApiProperty({
    description: 'Revenue statistics by movie for the branch',
    type: () => [MovieRevenueStatsDto]
  })
  movieStats?: MovieRevenueStatsDto[];

  @ApiProperty()
  period: {
    startDate: string;
    endDate: string;
  };
}

export class MovieRevenueStatsDto implements RevenueByMovie {
  @ApiProperty()
  movieId: string;

  @ApiProperty()
  movieName: string;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  occupancyRate?: number; // % ghế đã bán / tổng ghế
}
