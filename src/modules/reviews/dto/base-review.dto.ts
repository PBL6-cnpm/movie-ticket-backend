import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class BaseReviewDto {
  @ApiProperty({ description: 'Rating of the review (1-10)' })
  @Max(10)
  @Min(1)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({ description: 'Comment of the review' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({ description: 'Movie ID is reviewed' })
  @IsString()
  @IsNotEmpty()
  movieId: string;

  @ApiProperty({ description: 'Account ID who reviews' })
  @IsString()
  @IsNotEmpty()
  accountId: string;
}
