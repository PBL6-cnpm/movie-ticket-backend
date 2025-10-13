import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { ActorResponseDto } from '@modules/actors/dto/actor-response.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MovieResponseDto } from './dto/movie-response.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';

@Public()
@Controller('movies')
@ApiTags('Movie')
export class MovieController extends BaseController {
  constructor(private readonly movieService: MovieService) {
    super();
  }

  @Get('now-showing')
  @ApiOperation({ summary: 'Get movies that are currently showing' })
  async getNowShowingMovies(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<MovieResponseDto>>> {
    const { items, total } = await this.movieService.getNowShowingMovies(dto);
    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming movies' })
  async getUpcomingMovies(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<MovieResponseDto>>> {
    const { items, total } = await this.movieService.getUpcomingMovies(dto);
    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Get('top/revenue/month')
  @ApiOperation({ summary: 'Get top 5 movies by revenue in current month' })
  async getTopRevenueMoviesThisMonth(): Promise<SuccessResponse<MovieResponseDto[]>> {
    const result = await this.movieService.getTopRevenueMoviesThisMonth();
    return this.success(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('poster'))
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        duration: { type: 'number' },
        ageLimit: { type: 'number' },
        director: { type: 'string' },
        trailer: { type: 'string' },
        releaseDate: { type: 'string', format: 'date' },
        screeningStart: { type: 'string', format: 'date' },
        screeningEnd: { type: 'string', format: 'date' },
        genre: { type: 'array', items: { type: 'string' } },
        actors: { type: 'array', items: { type: 'string' } },
        poster: { type: 'string', format: 'binary' }
      }
    }
  })
  async createMovie(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile() poster: Express.Multer.File
  ): Promise<SuccessResponse<MovieResponseDto>> {
    const newMovie = await this.movieService.createMovie(createMovieDto, poster);
    return this.created(newMovie);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('poster'))
  @ApiOperation({ summary: 'Update movie by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateMovieDto })
  async updateMovie(
    @Param('id') id: string,
    @Body() updateDto: UpdateMovieDto,
    @UploadedFile() poster?: Express.Multer.File
  ): Promise<SuccessResponse<MovieResponseDto>> {
    const updatedMovie = await this.movieService.updateMovie(id, updateDto, poster);
    return this.success(updatedMovie);
  }

  @Get('search/by-name')
  @ApiOperation({ summary: 'Search movies & actors by name' })
  async searchByName(
    @Query('name') name: string,
    @Query() dto: PaginationDto
  ): Promise<
    SuccessResponse<{
      movies: IPaginatedResponse<MovieResponseDto>;
      actors: IPaginatedResponse<ActorResponseDto>;
    }>
  > {
    const { movies, actors, totalMovies, totalActors } = await this.movieService.searchByName(
      name,
      dto
    );

    const paginatedMovies = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: totalMovies,
      items: movies
    });

    const paginatedActors = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: totalActors,
      items: actors
    });

    return this.success({
      movies: paginatedMovies,
      actors: paginatedActors
    });
  }

  @Get('search/by-name-movie')
  @ApiOperation({ summary: 'Search movies & actors by name' })
  async searchByNameMovie(
    @Query('name') name: string,
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<MovieResponseDto>>> {
    const { movies, totalMovies } = await this.movieService.searchByName(name, dto);

    const paginatedMovies = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: totalMovies,
      items: movies
    });

    return this.success(paginatedMovies);
  }

  @Get('genres/all')
  @ApiOperation({ summary: 'Get all movie genres' })
  async getAllGenres(): Promise<SuccessResponse<{ id: string; name: string }[]>> {
    const genres = await this.movieService.getAllGenres();
    return this.success(genres);
  }

  @Get('filter/by-genres')
  @ApiOperation({ summary: 'Filter movies by genres (paginated)' })
  async filterByGenres(
    @Query('genres') genres: string | string[],
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<MovieResponseDto>>> {
    let genreList: string[] = [];
    if (typeof genres === 'string') {
      genreList = genres.split(',').map((g) => g.trim());
    } else if (Array.isArray(genres)) {
      genreList = genres;
    }
    const { items, total } = await this.movieService.filterMoviesByGenre(genreList, dto);
    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of movies' })
  async getPaginatedMovies(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<MovieResponseDto>>> {
    const { items, total } = await this.movieService.getList(dto);

    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get movie by ID' })
  async getMovieById(@Param('id') id: string): Promise<SuccessResponse<MovieResponseDto>> {
    const movie = await this.movieService.getMovieById(id);
    return this.success(movie);
  }

  @Get('/get-with-branches/:id')
  async getMovieWithBranches(
    @Param('id') id: string
  ): Promise<SuccessResponse<IPaginatedResponse<MovieResponseDto>>> {
    const result = await this.movieService.getMovieWithBranches(id);
    return this.success(result);
  }
}
