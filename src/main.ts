import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.use(helmet());

  const allowedOrigins = isProduction
    ? configService
        .get<string>('ALLOWED_ORIGINS', '')
        .split(',')
        .filter(Boolean)
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // IMPORTANT: Antes de subir para produção descomente a linha abaixo para desabilitar o Swagger
  // NOTE: Em produção (NODE_ENV=production) o Swagger é desabilitado por segurança.
  // if (!isProduction) { // -> isProduction check
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Superheros API')
    .setDescription(
      'API de gerenciamento de super-heróis com autenticação JWT e controle de acesso por perfil',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Registro, login, logout e gerenciamento de tokens')
    .addTag('Users', 'Perfil e edição de usuário')
    .addTag('Heroes', 'CRUD de super-heróis e ciclo de vida')
    .addTag('Attributes', 'CRUD de atributos do herói')
    .addTag('Powers', 'CRUD de poderes do herói')
    .addTag('Reports', 'Relatório paginado de super-heróis')
    .addTag('Battles', 'Batalhas entre editoras')
    .addTag('Health', 'Health check endpoint')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  // } // -> isProduction check

  await app.listen(port);
  console.log(`API: http://localhost:${port}/api/v1`);
}

bootstrap();
