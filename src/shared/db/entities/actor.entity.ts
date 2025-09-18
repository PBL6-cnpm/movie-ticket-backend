import { ENTITIES } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { MovieActor } from './movie-actor.entity';

@Entity(ENTITIES.ACTOR)
export class Actor extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'actor_id' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'picture' })
  picture: string;

  @OneToMany(() => MovieActor, (movieActor) => movieActor.actor)
  movieActors: MovieActor[];
}
