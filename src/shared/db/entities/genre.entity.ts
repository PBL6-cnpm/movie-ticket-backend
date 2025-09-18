import { ENTITIES } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Movie } from './movie.entity';

@Entity(ENTITIES.GENRE)
export class Genre extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'genre_id' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @OneToMany(() => Movie, (movie) => movie.genre)
  movies: Movie[];
}
