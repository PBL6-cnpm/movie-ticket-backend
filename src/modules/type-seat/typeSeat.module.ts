import { Module } from '@nestjs/common';
import { TypeSeatController } from './typeSeat.controller';
import { TypeSeatService } from './typeSeat.service';

@Module({
  controllers: [TypeSeatController],
  providers: [TypeSeatService],
  exports: [TypeSeatService]
})
export class TypeSeatModule {}
