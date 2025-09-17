import { ENTITIES } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { MovieActor } from './movie-actor.entity';
import { Reviews } from './reviews.entity';
import { ShowTime } from './show-time.entity';

@Entity(ENTITIES.MOVIE)
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

    @OneToMany(() => MovieActor, (movieActor) => movieActor.movie)
    movieActors: MovieActor[];

    @OneToMany(() => Reviews, (reviews) => reviews.movie)
    reviewss: Reviews[];

    @OneToMany(() => ShowTime, (showTime) => showTime.movie)
    showTimes: ShowTime[];
}
