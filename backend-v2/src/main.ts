// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix (optional but recommended)
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: true, // Change to specific domains in production
    credentials: true,
  });

  const port = 5000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📡 API available at: http://localhost:${port}/api`);
}

bootstrap();