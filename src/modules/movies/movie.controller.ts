import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
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

// @ApiBearerAuth()
@Public()
@Controller('movies')
@ApiTags('Movie')
export class MovieController extends BaseController {
  constructor(private readonly movieService: MovieService) {
    super();
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get movie by ID' })
  async getMovieById(@Param('id') id: string): Promise<SuccessResponse<MovieResponseDto>> {
    const movie = await this.movieService.getMovieById(id);
    return this.success(movie);
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
  async searchByName(@Query('name') name: string): Promise<SuccessResponse<MovieResponseDto[]>> {
    const movies = await this.movieService.searchByName(name);
    return this.success(movies);
  }

  @Get('genres/all')
  @ApiOperation({ summary: 'Get all movie genres' })
  async getAllGenres(): Promise<SuccessResponse<{ id: string; name: string }[]>> {
    const genres = await this.movieService.getAllGenres();
    return this.success(genres);
  }

  @Get('filter/by-genres')
  @ApiOperation({ summary: 'Filter movies by genres' })
  async filterByGenres(
    @Query('genres') genres: string | string[]
  ): Promise<SuccessResponse<MovieResponseDto[]>> {
    let genreList: string[] = [];

    if (typeof genres === 'string') {
      genreList = genres.split(',').map((g) => g.trim());
    } else if (Array.isArray(genres)) {
      genreList = genres;
    }

    const movies = await this.movieService.filterMovies(genreList);
    return this.success(movies);
  }
}
