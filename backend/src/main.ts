// Set timezone to Israel so Date operations use local time
process.env.TZ = 'Asia/Jerusalem';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.gentlemen1996.co.il',
    'https://gentlemen1996.co.il',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Block requests with no origin (non-browser clients) in production
      if (!origin) {
        const isProd = process.env.NODE_ENV === 'production';
        return callback(null, !isProd);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();
