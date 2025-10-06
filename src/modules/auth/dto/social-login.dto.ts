import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty({ description: 'Google id token' })
  @IsNotEmpty()
  token: string;
}
