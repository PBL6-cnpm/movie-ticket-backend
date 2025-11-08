import { SeatModule } from '@modules/seat/seat.module';
import { Module } from '@nestjs/common';
import { ShowTimeController } from './show-time.controller';
import { ShowTimeService } from './show-time.service';

@Module({
  imports: [SeatModule],
  controllers: [ShowTimeController],
  providers: [ShowTimeService],
  exports: [ShowTimeService]
})
export class ShowTimeModule {}
