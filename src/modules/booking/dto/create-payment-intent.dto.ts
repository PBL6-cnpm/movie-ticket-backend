import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;
}
