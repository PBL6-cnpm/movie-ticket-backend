import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { swaggerConfig } from './configs/swagger.config';
import { URL } from '@configs/env.config';

export async function createApp(): Promise<NestExpressApplication> {
  // Transaction
  initializeTransactionalContext();

  // Create Nest Application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true
  });

  // Enable CORS
  app.enableCors({
    credentials: true,
    origin: [URL.clientBaseUrlDev, URL.clientBaseUrl, URL.internalClientBaseUrl]
  });

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
