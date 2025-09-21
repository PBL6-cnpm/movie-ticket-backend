import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { PickType } from '@nestjs/swagger';

export class ResendEmailDto extends PickType(BaseAccountDto, ['email'] as const) {}
