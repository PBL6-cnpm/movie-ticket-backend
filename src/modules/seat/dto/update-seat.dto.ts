import { PickType } from '@nestjs/swagger';
import { BaseSeatDto } from './base-seat.dto';

export class UpdateSeatDto extends PickType(BaseSeatDto, ['name', 'typeSeatId']) {}
