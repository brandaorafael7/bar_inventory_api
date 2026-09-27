import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from '../src/users/schemas/user.schema';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

interface AuthResponseBody {
  accessToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  message?: string | string[];
}

describe('Auth Flow (E2E)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let userModel: Model<UserDocument>;
  const uniquePrefix = `auth_e2e_${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    const rawServer: unknown = app.getHttpServer();
    server = rawServer as Parameters<typeof request>[0];

    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await userModel.deleteMany({ email: new RegExp(uniquePrefix, 'i') });
    await app.close();
  });

  it('deve registrar um novo funcionário padrão (POST /auth/register)', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({
        name: 'Operador Teste',
        email: `${uniquePrefix}_emp@bar.com`,
        password: 'senhaSegura123',
      });

    expect(res.status).toBe(201);
    const body = res.body as AuthResponseBody;
    expect(body).toHaveProperty('accessToken');
    expect(body.user?.email).toBe(`${uniquePrefix}_emp@bar.com`);
    expect(body.user?.role).toBe(Role.EMPLOYEE);
  });

  it('deve registrar um administrador quando a adminKey correta for informada (POST /auth/register)', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({
        name: 'Gerente Admin',
        email: `${uniquePrefix}_admin@bar.com`,
        password: 'senhaAdminForte123',
        adminKey: process.env.ADMIN_REGISTRATION_KEY || 'bar-admin-2026',
      });

    expect(res.status).toBe(201);
    const body = res.body as AuthResponseBody;
    expect(body).toHaveProperty('accessToken');
    expect(body.user?.role).toBe(Role.ADMIN);
  });

  it('deve rejeitar registro com e-mail duplicado (POST /auth/register)', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({
        name: 'Outro Usuario',
        email: `${uniquePrefix}_emp@bar.com`,
        password: 'outraSenha123',
      });

    expect(res.status).toBe(409);
    const body = res.body as AuthResponseBody;
    expect(body.message).toContain('Já existe um usuário com este e-mail.');
  });

  it('deve realizar login com sucesso e retornar token JWT (POST /auth/login)', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({
        email: `${uniquePrefix}_emp@bar.com`,
        password: 'senhaSegura123',
      });

    expect(res.status).toBe(200);
    const body = res.body as AuthResponseBody;
    expect(body).toHaveProperty('accessToken');
    expect(body.user?.email).toBe(`${uniquePrefix}_emp@bar.com`);
  });

  it('deve rejeitar login com credenciais incorretas (POST /auth/login)', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({
        email: `${uniquePrefix}_emp@bar.com`,
        password: 'senhaErrada123',
      });

    expect(res.status).toBe(401);
    const body = res.body as AuthResponseBody;
    expect(body.message).toBe('E-mail ou senha incorretos.');
  });
});
