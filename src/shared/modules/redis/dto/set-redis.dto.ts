import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetRedisValueDto {
  @ApiProperty({
    description: 'The key to store in Redis',
    example: 'user:123'
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'The value to store (string, number, or a JSON object)',
    example: { name: 'John Doe', email: 'john@example.com' }
  })
  @IsNotEmpty()
  value: string | number | Record<string, any>;

  @ApiPropertyOptional({
    description: 'Time to live (TTL) of the key in seconds',
    example: 3600, // 1 hour
    default: 60
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  ttl?: number;
}
