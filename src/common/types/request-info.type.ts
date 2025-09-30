import { IsOptional, ValidateNested } from 'class-validator';
import { ContextUser } from './user.type';

class Header {
  @ValidateNested()
  @IsOptional()
  authorization?: string;
}

export class RequestInfoType {
  @ValidateNested()
  @IsOptional()
  user: ContextUser;

  @ValidateNested()
  @IsOptional()
  headers?: Header;
}
