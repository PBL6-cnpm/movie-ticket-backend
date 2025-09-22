import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  NotFoundException,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { RedisService } from './redis.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { SetRedisValueDto } from './dto/set-redis.dto';
import { BaseController } from '@bases/base-controller';

@ApiTags('Redis')
@Controller('redis')
export class RedisController extends BaseController {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a key-value pair in Redis' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created key'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.'
  })
  async setValue(@Body() setRedisValueDto: SetRedisValueDto): Promise<SuccessResponse<string>> {
    const { key, value, ttl } = setRedisValueDto;
    await this.redisService.set(key, value, ttl);
    return this.success(key);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a key from Redis' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The key has been successfully deleted'
  })
  @ApiParam({
    name: 'key',
    description: 'The key to delete',
    example: 'user:123'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The key was not found'
  })
  async deleteValue(@Param('key') key: string): Promise<{ message: string; deletedCount: number }> {
    const deletedCount = await this.redisService.del(key);

    if (deletedCount === 0) {
      throw new NotFoundException(`Key '${key}' was not found.`);
    }

    return {
      message: `Key '${key}' has been successfully deleted`,
      deletedCount: deletedCount
    };
  }

  @Get('exists/:key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a key exists in Redis' })
  @ApiParam({
    name: 'key',
    description: 'The key to check',
    example: 'user:123'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns whether the key exists or not'
  })
  async checkExistence(@Param('key') key: string): Promise<{ key: string; exists: boolean }> {
    const exists = await this.redisService.exists(key);
    return { key, exists };
  }
}
