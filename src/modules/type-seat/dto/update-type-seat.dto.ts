import { PartialType } from '@nestjs/swagger';
import { BaseTypeSeatDto } from './base-type-seat.dto';

export class UpdateTypeSeatDto extends PartialType(BaseTypeSeatDto) {}
