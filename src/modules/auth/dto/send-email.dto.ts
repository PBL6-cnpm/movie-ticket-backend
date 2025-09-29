import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { PickType } from '@nestjs/swagger';

export class SendEmailDto extends PickType(BaseAccountDto, ['email'] as const) {}
