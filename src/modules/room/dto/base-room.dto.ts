import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class BaseRoomDto {
  @ApiProperty({
    description: 'Branch ID that the room belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty({ message: 'Branch ID không được để trống' })
  @IsUUID('4', { message: 'Branch ID phải là UUID hợp lệ' })
  branchId: string;

  @ApiProperty({
    description: 'Room name (unique within a branch)',
    example: 'Phòng A1',
    maxLength: 100
  })
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  @IsString({ message: 'Tên phòng phải là chuỗi ký tự' })
  name: string;
}
