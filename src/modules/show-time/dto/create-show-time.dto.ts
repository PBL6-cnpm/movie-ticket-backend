import { IsNotEmpty, IsUUID } from 'class-validator';
import { BaseShowTimeDto } from './base-show-time.dto';

export class CreateShowTimeDto extends BaseShowTimeDto {
  @IsNotEmpty()
  @IsUUID()
  movieId: string;

  @IsNotEmpty()
  @IsUUID()
  roomId: string;
}
