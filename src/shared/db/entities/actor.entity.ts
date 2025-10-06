import { Entities } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { MovieActor } from './movie-actor.entity';

@Entity(Entities.ACTOR)
export class Actor extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'actor_id' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 1000, nullable: true })
  description: string;

  @Column({ name: 'picture' })
  picture: string;

  @OneToMany(() => MovieActor, (movieActor) => movieActor.actor, { cascade: true })
  movieActors: MovieActor[];
}
