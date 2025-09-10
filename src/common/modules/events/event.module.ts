import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
// import { AuthModule } from 'src/modules/auth/auth.module';

// @nestjs/event-emitter is global by default
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false
    })

    // AuthModule
  ]
})
export class EventModule {}
