import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite conexões do frontend React
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Bar Inventory API')
    .setDescription('API de Gestão e Controle de Estoque para Bares e Tabacarias')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação e Login')
    .addTag('categories', 'Categorias de Produtos')
    .addTag('products', 'Produtos e Controle de Estoque')
    .addTag('stock-movements', 'Histórico e Auditoria de Estoque')
    .addTag('users', 'Gestão de Usuários')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Cole o token JWT recebido no login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicação rodando em: http://localhost:${port}`);
}
bootstrap();