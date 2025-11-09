import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ description: 'Rating of the review (1-10)' })
  @Max(10)
  @Min(1)
  @IsOptional()
  rating: number;

  @ApiProperty({ description: 'Comment of the review' })
  @IsString()
  @IsOptional()
  comment: string;

  @ApiProperty({ description: 'Movie ID is reviewed' })
  @IsString()
  @IsNotEmpty()
  movieId: string;
}
