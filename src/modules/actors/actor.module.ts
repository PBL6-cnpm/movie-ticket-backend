import { Module } from '@nestjs/common';
import { CloudinaryService } from 'shared/modules/cloudinary/cloudinary.service';
import { ActorController } from './actor.controller';
import { ActorService } from './actor.service';

@Module({
  controllers: [ActorController],
  providers: [ActorService, CloudinaryService]
})
export class ActorModule {}
