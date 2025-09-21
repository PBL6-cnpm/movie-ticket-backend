import { Entities } from '@common/enums';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Genre } from './genre.entity';
import { MovieActor } from './movie-actor.entity';
import { Review } from './review.entity';
import { ShowTime } from './show-time.entity';

@Entity(Entities.MOVIE)
export class Movie extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'movie_id' })
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'duration', type: 'int', nullable: false })
  duration: number;

  @Column({ name: 'age_limit', type: 'int', nullable: false })
  ageLimit: number;

  @Column({ name: 'director' })
  director: string;

  @Column({ name: 'trailer' })
  trailer: string;

  @Column({ name: 'poster' })
  poster: string;

  @Column({ name: 'genre_id' })
  genreId: string;

  @Column({ name: 'release_date', type: 'timestamp' })
  releaseDate: Date;

  @OneToMany(() => MovieActor, (movieActor) => movieActor.movie)
  movieActors: MovieActor[];

  @OneToMany(() => Review, (review) => review.movie)
  reviews: Review[];

  @OneToMany(() => ShowTime, (showTime) => showTime.movie)
  showTimes: ShowTime[];

  @ManyToOne(() => Genre, (genre) => genre.movies)
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;
}
