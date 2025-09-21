import { Entities } from '@common/enums';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Actor } from './actor.entity';
import { Movie } from './movie.entity';

@Entity(Entities.MOVIE_ACTOR)
export class MovieActor extends BaseEntityTime {
  @PrimaryColumn({ name: 'movie_id' })
  movieId: string;

  @PrimaryColumn({ name: 'actor_id' })
  actorId: string;

  @ManyToOne(() => Movie, (movie) => movie.movieActors, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Actor, (actor) => actor.movieActors, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'actor_id' })
  actor: Actor;
}
