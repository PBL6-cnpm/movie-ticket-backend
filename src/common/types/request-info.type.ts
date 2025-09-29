import { IsOptional, ValidateNested } from 'class-validator';
import { IContextUser } from './user.type';

class Header {
  @ValidateNested()
  @IsOptional()
  authorization?: string;
}

export class RequestInfoType {
  @ValidateNested()
  @IsOptional()
  user: IContextUser;

  @ValidateNested()
  @IsOptional()
  headers?: Header;
}
