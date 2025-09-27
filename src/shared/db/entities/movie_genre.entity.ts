import { Entities } from '@common/enums';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Genre } from './genre.entity';
import { Movie } from './movie.entity';

@Entity(Entities.MOVIE_GENRE)
export class MovieGenre extends BaseEntityTime {
  @PrimaryColumn({ name: 'movie_id' })
  movieId: string;

  @PrimaryColumn({ name: 'genre_id' })
  genreId: string;

  @ManyToOne(() => Movie, (movie) => movie.movieGenres, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Genre, (genre) => genre.movieGenres, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;
}
