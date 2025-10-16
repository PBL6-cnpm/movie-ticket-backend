import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';

export class CreateRefreshmentDto {
  @ApiProperty({ description: 'Name of the refreshment' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
    description: 'Picture image file'
  })
  picture: any;

  @ApiProperty({ description: 'Price of the refreshment' })
  @IsNotEmpty()
  @IsInt()
  @Min(5000)
  price: number;

  @ApiProperty({
    description: 'Indicates if the refreshment is currently available',
    default: true
  })
  @Type(() => Boolean)
  @IsBoolean()
  isCurrent: boolean = true;
}
