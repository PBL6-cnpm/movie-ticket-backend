import { PickType } from '@nestjs/swagger';
import { BaseSpecialDateDto } from './base-special-date.dto';

export class UpdateSpecialDateDto extends PickType(BaseSpecialDateDto, ['additionalPrice']) {}
