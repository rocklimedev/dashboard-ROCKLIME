import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.set('trust proxy', 1);

  const corsOrigins = config.get<string[]>('corsOrigins') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: true,
      hsts: { maxAge: 31536000, includeSubDomains: true },
    }),
  );
  app.use(cookieParser());
  expressInstance.disable('x-powered-by');

  // Same blocked-path guard as the legacy index.js middleware.
  app.use((req: any, res: any, next: any) => {
    const blockedPaths = ['/wp-admin', '/wp-login.php', '/phpmyadmin', '/.env'];
    if (blockedPaths.some((p) => req.url.includes(p))) {
      return res.status(444).end();
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api', {
    // /health stays unprefixed like the legacy app; /api/health is still
    // reachable because HealthController declares both routes explicitly.
    exclude: ['health'],
  });

  const port = config.get<number>('port') || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Environment: ${config.get('env')}`);
}

bootstrap();
