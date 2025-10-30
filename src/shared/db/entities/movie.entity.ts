import { Entities } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { MovieActor } from './movie-actor.entity';
import { MovieGenre } from './movie-genre.entity';
import { Review } from './review.entity';
import { ShowTime } from './show-time.entity';

@Entity(Entities.MOVIE)
export class Movie extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'movie_id' })
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 1000, nullable: true })
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

  @Column({ name: 'release_date', type: 'timestamp' })
  releaseDate: Date;

  @Column({ name: 'screening_start', type: 'timestamp', nullable: true })
  screeningStart: Date;

  @Column({ name: 'screening_end', type: 'timestamp', nullable: true })
  screeningEnd: Date;

  @OneToMany(() => MovieActor, (movieActor) => movieActor.movie, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  movieActors: MovieActor[];

  @OneToMany(() => Review, (review) => review.movie, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  reviews: Review[];

  @OneToMany(() => ShowTime, (showTime) => showTime.movie, { cascade: true })
  showTimes: ShowTime[];

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.movie, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  movieGenres: MovieGenre[];
}
