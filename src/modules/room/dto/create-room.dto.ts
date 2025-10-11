import { PickType } from '@nestjs/swagger';
import { BaseRoomDto } from './base-room.dto';

export class CreateRoomDto extends PickType(BaseRoomDto, ['name']) {}
