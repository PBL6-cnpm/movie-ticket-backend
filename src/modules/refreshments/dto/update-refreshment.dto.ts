import { PartialType } from '@nestjs/swagger';
import { CreateRefreshmentDto } from './create-refreshment.dto';

export class UpdateRefreshmentDto extends PartialType(CreateRefreshmentDto) {}
