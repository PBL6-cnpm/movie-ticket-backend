import { Controller, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  path: '/',
  version: VERSION_NEUTRAL
})
export class AppController {}
