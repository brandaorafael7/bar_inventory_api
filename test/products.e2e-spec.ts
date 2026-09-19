import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from '../src/users/schemas/user.schema';
import { Category, CategoryDocument } from '../src/categories/schemas/category.schema';
import { JwtService } from '@nestjs/jwt';

describe('Products Flow (E2E)', () => {
  let app: INestApplication;
  let token: string;
  let userModel: Model<UserDocument>;
  let categoryModel: Model<CategoryDocument>;
  let testUserId: Types.ObjectId;
  let testCategoryId: Types.ObjectId;

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
      }),
    );

    await app.init();

    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    categoryModel = app.get<Model<CategoryDocument>>(getModelToken(Category.name));
    const jwtService = app.get(JwtService);

    // Cria Usuário ADMIN de teste
    testUserId = new Types.ObjectId();
    await userModel.create({
      _id: testUserId,
      name: 'Admin Teste E2E',
      email: `admin.e2e.${Date.now()}@bar.com`,
      password: 'hash_fake_para_teste',
      role: Role.ADMIN,
      isActive: true,
    });

    // Cria Categoria válida de teste
    testCategoryId = new Types.ObjectId();
    await categoryModel.create({
      _id: testCategoryId,
      name: `Categoria E2E ${Date.now()}`,
      isActive: true,
    });

    // Token assinado
    token = jwtService.sign(
      { sub: testUserId.toString(), email: 'admin.e2e@bar.com', role: 'ADMIN' },
      { secret: process.env.JWT_SECRET || 'secretKey' },
    );
  });

  afterAll(async () => {
    if (testUserId) {
      await userModel.findByIdAndDelete(testUserId);
    }
    if (testCategoryId) {
      await categoryModel.findByIdAndDelete(testCategoryId);
    }
    await app.close();
  });

  it('deve aceitar o payload completo com eventPrice e costPrice sem quebrar o ValidationPipe', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Whisky Teste Automatizado ${Date.now()}`,
        category: testCategoryId.toString(),
        dayPrice: 130,
        eventPrice: 140,
        costPrice: 110,
        currentStock: 6,
        minStock: 1,
        unit: 'garrafa',
      });

    if (res.status !== 201) {
      console.log('\n--- RETORNO DE ERRO ---');
      console.log(JSON.stringify(res.body, null, 2));
      console.log('-----------------------\n');
    }

    expect(res.status).toBe(201);
    expect(res.body.name).toContain('Whisky Teste Automatizado');
    expect(res.body.eventPrice).toBe(140);
    expect(res.body.costPrice).toBe(110);
  });
});