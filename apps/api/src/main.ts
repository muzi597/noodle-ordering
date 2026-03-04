import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function parseCorsOrigins(): string[] | '*' {
  const originsRaw = process.env.CORS_ORIGINS?.trim();
  if (originsRaw) {
    const list = originsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (list.includes('*')) return '*';
    return list;
  }

  // Backwards compatible: single origin
  const originSingle = process.env.CORS_ORIGIN?.trim();
  if (originSingle) return originSingle === '*' ? '*' : [originSingle];

  return '*';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = parseCorsOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // allow curl/postman (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins === '*') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000);
  console.log(`API running on port ${process.env.PORT || 3000}`);
}
bootstrap();
