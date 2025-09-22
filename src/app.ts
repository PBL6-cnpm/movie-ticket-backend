import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { swaggerConfig } from './configs/swagger.config';

export async function createApp(): Promise<NestExpressApplication> {
  // Transaction
  initializeTransactionalContext();

  // Create Nest Application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors();

  app.enableShutdownHooks();

  // Static Files
  app.use('/public', express.static(join(__dirname, '../', 'public')));

  // Api
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  });

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  // Middlewares
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Exception filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger
  const options = swaggerConfig();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  return app;
}
