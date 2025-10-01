import { Actor } from 'shared/db/entities/actor.entity';

export class ActorResponseDto {
  id: string;
  name: string;
  description: string;
  picture: string;

  movies: { id: string; name: string; poster: string }[];

  createdAt: Date;
  updatedAt: Date;

  constructor(actor: Actor) {
    this.id = actor.id;
    this.name = actor.name;
    this.description = actor.description;
    this.picture = actor.picture;

    this.movies = actor.movieActors
      ? actor.movieActors.map((ma) => ({
          id: ma.movie.id,
          name: ma.movie.name,
          poster: ma.movie.poster
        }))
      : [];

    this.createdAt = actor.createdAt;
    this.updatedAt = actor.updatedAt;
  }
}
