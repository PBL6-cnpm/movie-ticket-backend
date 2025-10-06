import { Entities } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { MovieGenre } from './movie-genre.entity';

@Entity(Entities.GENRE)
export class Genre extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'genre_id' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.genre, { cascade: true })
  movieGenres: MovieGenre[];
}
