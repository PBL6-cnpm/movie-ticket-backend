import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateActorDto {
  @ApiProperty({
    type: String,
    description: 'Actor name',
    example: 'Leonardo DiCaprio'
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Actor description',
    example: 'An American actor and film producer'
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
    description: 'Picture image file'
  })
  picture: any;
}
