import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  // Print all environment variables in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(process.env);
  }
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
