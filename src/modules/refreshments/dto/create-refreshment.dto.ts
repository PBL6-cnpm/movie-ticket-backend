import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  @Type(() => String) //  ép luôn về string trước
  @Transform(({ value }) => {
    const v = String(value).toLowerCase().trim();
    if (v === 'false' || v === '0') return false;
    if (v === 'true' || v === '1') return true;
    return true;
  })
  @IsBoolean()
  isCurrent: boolean = true;
}
