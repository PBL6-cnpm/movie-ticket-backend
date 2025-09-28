import { AccountModule } from '@modules/accounts/account.module';
import { Module } from '@nestjs/common';
import { CloudinaryService } from '../../shared/modules/cloudinary/cloudinary.service';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';

@Module({
  imports: [AccountModule],
  controllers: [MovieController],
  providers: [MovieService, CloudinaryService]
})
export class MovieModule {}
