import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });

  app.use(helmet());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-nextjs-app.com',
    'capacitor://localhost',
    'tauri://localhost:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const config = new DocumentBuilder()
    .setTitle('Headless Auth API')
    .setDescription('The Headless Auth API description')
    .setVersion('1.0')
    .addTag('auth')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new DatabaseExceptionFilter());

  // TODO
  // const throttlerGuard = app.get(CustomThrottlerGuard);
  // app.useGlobalGuards(throttlerGuard);

  await app.listen(3000);
}
bootstrap();
