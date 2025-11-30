import { ApiProperty } from '@nestjs/swagger';

export class PopularMovieResponseDto {
  @ApiProperty()
  movieId: string;

  @ApiProperty()
  movieName: string;

  @ApiProperty()
  bookingCount: number;

  constructor(partial: Partial<PopularMovieResponseDto>) {
    Object.assign(this, partial);
  }
}
