import { Module } from '@nestjs/common';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import { RefreshmentController } from './refreshment.controller';
import { RefreshmentService } from './refreshment.service';

@Module({
  controllers: [RefreshmentController],
  providers: [RefreshmentService, CloudinaryService]
})
export class RefreshmentModule {}
