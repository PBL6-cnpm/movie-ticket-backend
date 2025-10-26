import { PickType } from '@nestjs/swagger';
import { BaseTypeDayDto } from './base-type-day.dto';

export class UpdateTypeDayDto extends PickType(BaseTypeDayDto, ['additionalPrice']) {}
