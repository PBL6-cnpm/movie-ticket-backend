import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { Logger } from '@nestjs/common';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

dotenv.config();

async function bootstrap() {
  initializeTransactionalContext();

  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const logger = new Logger('Seeder');

  try {
    logger.log('Starting seeding process...');
    const seeder = appContext.get(SeederService);
    await seeder.seed();
    logger.log('Seeding finished successfully');
  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    await appContext.close();
    logger.log('Application context closed');
  }
}

bootstrap().catch((error) => {
  console.error('Top-level error in seeder:', error);
  process.exit(1);
});
