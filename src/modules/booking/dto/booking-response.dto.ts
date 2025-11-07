import { BookingStatus } from '@common/enums/booking.enum';
import { RefreshmentResponseDto } from '@modules/refreshments/dto/refreshment-response.dto';
import { SeatResponseDto } from '@modules/seat/dto/seat-response.dto';
import { ShowTimeResponseDto } from '@modules/show-time/dto/show-time-response.dto';
import { Booking } from '@shared/db/entities/booking.entity';

export class BookingResponseDto {
  id: string;
  status: BookingStatus;
  totalBookingPrice: number;
  dateTimeBooking: Date;
  qrUrl?: string;
  showTime: ShowTimeResponseDto;
  seats: SeatResponseDto[];
  refreshmentss?: RefreshmentResponseDto[];

  constructor(booking: Booking) {
    this.id = booking.id;
    this.status = booking.status;
    this.totalBookingPrice = booking.totalBookingPrice;
    this.dateTimeBooking = booking.dateTimeBooking;
    this.qrUrl = booking.qrUrl;
    this.showTime = new ShowTimeResponseDto(booking.showTime, false);
    this.seats = booking.bookSeats.map((bookSeat) => new SeatResponseDto(bookSeat.seat));
    this.refreshmentss = booking.bookRefreshmentss
      ? booking.bookRefreshmentss.map(
          (bookRefreshment) => new RefreshmentResponseDto(bookRefreshment.refreshments, false)
        )
      : [];
  }
}
