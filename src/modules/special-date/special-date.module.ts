import { Module } from '@nestjs/common';
import { SpecialDateController } from './special-date.controller';
import { SpecialDateService } from './special-date.service';

@Module({
  controllers: [SpecialDateController],
  providers: [SpecialDateService],
  exports: [SpecialDateService]
})
export class SpecialDateModule {}
