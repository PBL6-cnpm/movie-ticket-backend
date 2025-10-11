import { PickType } from '@nestjs/swagger';
import { BaseRoomDto } from './base-room.dto';

export class UpdateRoomDto extends PickType(BaseRoomDto, ['name']) {}
