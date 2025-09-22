import { Entities } from '@common/enums';
import { Max, Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Account } from './account.entity';
import { Movie } from './movie.entity';

@Entity(Entities.REVIEW)
export class Review extends BaseEntityTime {
  @PrimaryColumn({ name: 'movie_id' })
  movieId: string;

  @PrimaryColumn({ name: 'account_id' })
  accountId: string;

  @Column({
    name: 'rating',
    type: 'int',
    default: 5,
    nullable: false
  })
  @Min(1)
  @Max(5)
  rating: number;

  @Column({
    name: 'comment',
    nullable: false
  })
  comment: string;

  @ManyToOne(() => Movie, (movie) => movie.reviews, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Account, (account) => account.reviews, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'account_id' })
  account: Account;
}
