import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from '../src/users/schemas/user.schema';
import {
  Category,
  CategoryDocument,
} from '../src/categories/schemas/category.schema';
import { JwtService } from '@nestjs/jwt';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

interface CategoryResponseBody {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  message?: string | string[];
}

describe('Categories Flow (E2E)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let adminToken: string;
  let employeeToken: string;
  let userModel: Model<UserDocument>;
  let categoryModel: Model<CategoryDocument>;
  let createdCategoryId: string;
  const uniquePrefix = `cat_e2e_${Date.now()}`;

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
    categoryModel = app.get<Model<CategoryDocument>>(
      getModelToken(Category.name),
    );
    const jwtService = app.get(JwtService);

    const adminId = new Types.ObjectId();
    await userModel.create({
      _id: adminId,
      name: 'Admin Cat Test',
      email: `${uniquePrefix}_admin@bar.com`,
      password: 'hash_fake_para_teste',
      role: Role.ADMIN,
      isActive: true,
    });

    const employeeId = new Types.ObjectId();
    await userModel.create({
      _id: employeeId,
      name: 'Employee Cat Test',
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
    await categoryModel.deleteMany({ name: new RegExp(uniquePrefix, 'i') });
    await app.close();
  });

  it('deve criar uma nova categoria como ADMIN (POST /categories)', async () => {
    const res = await request(server)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `${uniquePrefix}_Cervejas Artesanais`,
        description: 'IPAs, Ales e Stouts especiais',
      });

    expect(res.status).toBe(201);
    const body = res.body as CategoryResponseBody;
    expect(body).toHaveProperty('_id');
    expect(body.name).toBe(`${uniquePrefix}_Cervejas Artesanais`);
    createdCategoryId = body._id;
  });

  it('deve rejeitar criação de categoria por EMPLOYEE com 403 Forbidden (POST /categories)', async () => {
    const res = await request(server)
      .post('/categories')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: `${uniquePrefix}_Vinhos`,
      });

    expect(res.status).toBe(403);
  });

  it('deve rejeitar criação de categoria sem nome obrigatório com 400 Bad Request', async () => {
    const res = await request(server)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Sem nome',
      });

    expect(res.status).toBe(400);
  });

  it('deve listar categorias ativas (GET /categories)', async () => {
    const res = await request(server)
      .get('/categories')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    const body = res.body as CategoryResponseBody[];
    expect(Array.isArray(body)).toBe(true);
    const found = body.some((c) => c._id === createdCategoryId);
    expect(found).toBe(true);
  });

  it('deve buscar uma categoria pelo ID válido (GET /categories/:id)', async () => {
    const res = await request(server)
      .get(`/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    const body = res.body as CategoryResponseBody;
    expect(body._id).toBe(createdCategoryId);
  });

  it('deve rejeitar ID inválido com 400 Bad Request via ParseObjectIdPipe (GET /categories/:id)', async () => {
    const res = await request(server)
      .get('/categories/id-invalido-123')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(400);
    const body = res.body as { message: string | string[] };
    expect(body.message).toContain(
      'ID informado possui formato inválido para o MongoDB.',
    );
  });

  it('deve atualizar uma categoria existente como ADMIN (PATCH /categories/:id)', async () => {
    const res = await request(server)
      .patch(`/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Descrição atualizada com sucesso',
      });

    expect(res.status).toBe(200);
    const body = res.body as CategoryResponseBody;
    expect(body.description).toBe('Descrição atualizada com sucesso');
  });

  it('deve desativar uma categoria como ADMIN (DELETE /categories/:id)', async () => {
    const res = await request(server)
      .delete(`/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});
