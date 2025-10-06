import { ApiProperty } from '@nestjs/swagger';
import { Branch } from '@shared/db/entities/branch.entity';

export class BranchResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the branch',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'The name of the branch',
    example: 'CGV Vincom'
  })
  name: string;

  @ApiProperty({
    description: 'The address of the branch',
    example: '191 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM'
  })
  address: string;

  @ApiProperty({
    description: 'The creation timestamp',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update timestamp',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;

  constructor(branch: Branch) {
    this.id = branch.id;
    this.name = branch.name;
    this.address = branch.address;
    this.createdAt = branch.createdAt;
    this.updatedAt = branch.updatedAt;
  }
}
