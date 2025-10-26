import { Module } from '@nestjs/common';
import { TypeDayController } from './type-day.controller';
import { TypeDayService } from './type-day.service';

@Module({
  controllers: [TypeDayController],
  providers: [TypeDayService],
  exports: [TypeDayService]
})
export class TypeDayModule {}
