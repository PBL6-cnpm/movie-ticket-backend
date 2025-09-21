import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { PickType } from '@nestjs/swagger';

export class ResendCodeDto extends PickType(BaseAccountDto, ['email'] as const) {}
