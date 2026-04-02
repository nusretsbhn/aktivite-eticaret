import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Global request doğrulama: body parametrelerini otomatik dönüştür ve whitelist uygula.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  const config = app.get(ConfigService);
  const port = Number(config.get('PORT')) || 3000;

  const nodeEnv = config.get('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
  const swaggerEnabled = (config.get('SWAGGER_ENABLED') ?? 'true').toString() !== 'false';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Bodrum Aktivite API')
      .setDescription('Bodrum temalı aktivite e-ticaret platformu API')
      .setVersion('0.1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API started on port ${port} (${nodeEnv})`);
}
bootstrap();
