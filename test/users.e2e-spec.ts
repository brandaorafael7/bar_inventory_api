import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from '../src/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

interface UserResponseBody {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  message?: string | string[];
}

describe('Users & Roles Flow (E2E)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let adminToken: string;
  let employeeToken: string;
  let userModel: Model<UserDocument>;
  let createdUserId: string;
  const uniquePrefix = `user_e2e_${Date.now()}`;

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
    const jwtService = app.get(JwtService);

    const adminId = new Types.ObjectId();
    await userModel.create({
      _id: adminId,
      name: 'Super Admin E2E',
      email: `${uniquePrefix}_admin@bar.com`,
      password: 'hash_fake_para_teste',
      role: Role.ADMIN,
      isActive: true,
    });

    const employeeId = new Types.ObjectId();
    await userModel.create({
      _id: employeeId,
      name: 'Comum E2E',
      email: `${uniquePrefix}_emp@bar.com`,
      password: 'hash_fake_para_teste',
      role: Role.EMPLOYEE,
      isActive: true,
    });

    adminToken = jwtService.sign(
      {
        sub: adminId.toString(),
        email: `${uniquePrefix}_admin@bar.com`,
        role: Role.ADMIN,
      },
      { secret: process.env.JWT_SECRET || 'chave_super_secreta_jwt_bar_2026' },
    );

    employeeToken = jwtService.sign(
      {
        sub: employeeId.toString(),
        email: `${uniquePrefix}_emp@bar.com`,
        role: Role.EMPLOYEE,
      },
      { secret: process.env.JWT_SECRET || 'chave_super_secreta_jwt_bar_2026' },
    );
  });

  afterAll(async () => {
    await userModel.deleteMany({ email: new RegExp(uniquePrefix, 'i') });
    await app.close();
  });

  it('deve listar usuários cadastrados como ADMIN (GET /users)', async () => {
    const res = await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const body = res.body as UserResponseBody[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);
  });

  it('deve barrar tentativa de listar usuários por EMPLOYEE com 403 Forbidden (GET /users)', async () => {
    const res = await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it('deve criar novo usuário diretamente como ADMIN (POST /users)', async () => {
    const res = await request(server)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Garçom Extra',
        email: `${uniquePrefix}_garcom@bar.com`,
        password: 'senhaGarcom123',
        role: Role.EMPLOYEE,
      });

    expect(res.status).toBe(201);
    const body = res.body as UserResponseBody;
    expect(body).toHaveProperty('_id');
    expect(body.email).toBe(`${uniquePrefix}_garcom@bar.com`);
    createdUserId = body._id;
  });

  it('deve desativar usuário pelo ID como ADMIN (DELETE /users/:id)', async () => {
    const res = await request(server)
      .delete(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    const userInDb = await userModel.findById(createdUserId);
    expect(userInDb?.isActive).toBe(false);
  });

  it('deve rejeitar ID inválido com 400 Bad Request via ParseObjectIdPipe (DELETE /users/:id)', async () => {
    const res = await request(server)
      .delete('/users/id-usuario-falso')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    const body = res.body as { message: string | string[] };
    expect(body.message).toContain(
      'ID informado possui formato inválido para o MongoDB.',
    );
  });
});
