import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class CreateMovieDto {
  @ApiProperty({ description: 'Title of the movie' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Description of the movie',
    required: false
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Duration of the movie in minutes' })
  @IsInt()
  duration: number;

  @ApiProperty({ description: 'Age limit for the movie' })
  @IsInt()
  ageLimit: number;

  @ApiProperty({
    description: 'Director of the movie',
    required: false
  })
  @IsString()
  director: string;

  @ApiProperty({
    description: 'Trailer URL of the movie',
    required: false
  })
  @IsString()
  trailer: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  releaseDate: Date;

  @ApiProperty({ type: [String], description: 'Danh sách thể loại (genres) của bộ phim' })
  @IsArray()
  @IsString({ each: true }) // Kiểm tra rằng mỗi phần tử trong mảng là một chuỗi
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : (value as string[])
  )
  @IsNotEmpty()
  genre: string[];

  @ApiProperty({ type: [String], description: 'Danh sách tên diễn viên' })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : (value as string[])
  )
  actors: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Poster image file'
  })
  poster?: any;
}
