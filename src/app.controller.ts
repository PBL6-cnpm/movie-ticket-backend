import { Public } from '@common/decorators/public.decorator';
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  path: '/',
  version: VERSION_NEUTRAL
})
export class AppController {
  @Public()
  @Get()
  getRoot(): string {
    return 'Movie Ticket Backend API is running!';
  }
}
