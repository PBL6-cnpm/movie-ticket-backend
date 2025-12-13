import { AccountStatus } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserAccountStatusDto {
  @ApiProperty({
    enum: [AccountStatus.ACTIVE, AccountStatus.DELETED],
    description: 'New status for the user account'
  })
  @IsIn([AccountStatus.ACTIVE, AccountStatus.DELETED], {
    message: `status must be one of: ${AccountStatus.ACTIVE}, ${AccountStatus.DELETED}`
  })
  status: AccountStatus;
}
