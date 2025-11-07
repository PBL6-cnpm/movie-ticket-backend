import { PickType } from '@nestjs/swagger';
import { BaseAccountDto } from './base-account.dto';

export class UpdateStaffAccountDto extends PickType(BaseAccountDto, ['status']) {}
