import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class BaseSeatDto {
  @IsNotEmpty()
  @IsUUID()
  roomId: string;

  @IsNotEmpty()
  @IsUUID()
  typeSeatId: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}
