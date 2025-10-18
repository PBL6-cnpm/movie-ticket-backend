import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { ContextUser } from '@common/types/user.type';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { QueryHoldBookingDto } from './dto/querry-hold-booking.dto';

@Controller('booking')
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}
  @Post('hold')
  async holdBooking(@Body() body: QueryHoldBookingDto, @CurrentAccount() user: ContextUser) {
    return this.bookingService.holdBooking(body, user.id);
  }
}
