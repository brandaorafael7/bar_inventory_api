import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from '../src/users/schemas/user.schema';
import {
  Product,
  ProductDocument,
} from '../src/products/schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../src/stock-movements/schemas/stock-movement.schema';
import { JwtService } from '@nestjs/jwt';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { MovementType } from '../src/common/enums/movement-type.enum';

interface MovementResponseBody {
  _id: string;
  productId: {
    _id: string;
    name: string;
    unit?: string;
  };
  type: MovementType;
  quantity: number;
  reason?: string;
  userId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  message?: string | string[];
}

describe('Stock Movements Flow (E2E)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let employeeToken: string;
  let userModel: Model<UserDocument>;
  let productModel: Model<ProductDocument>;
  let movementModel: Model<StockMovementDocument>;
  let testProductId: Types.ObjectId;
  const uniquePrefix = `mov_e2e_${Date.now()}`;

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
    productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));
    movementModel = app.get<Model<StockMovementDocument>>(
      getModelToken(StockMovement.name),
    );
    const jwtService = app.get(JwtService);

    const employeeId = new Types.ObjectId();
    await userModel.create({
      _id: employeeId,
      name: 'Barista Operador',
      email: `${uniquePrefix}_bar@bar.com`,
      password: 'hash_fake_para_teste',
      role: Role.EMPLOYEE,
      isActive: true,
    });

    testProductId = new Types.ObjectId();
    await productModel.create({
      _id: testProductId,
      name: `${uniquePrefix}_Gin Tanqueray`,
      dayPrice: 120,
      currentStock: 20,
      minStock: 5,
      unit: 'garrafa',
      isActive: true,
    });

    employeeToken = jwtService.sign(
      {
        sub: employeeId.toString(),
        email: `${uniquePrefix}_bar@bar.com`,
        role: Role.EMPLOYEE,
      },
      { secret: process.env.JWT_SECRET || 'chave_super_secreta_jwt_bar_2026' },
    );
  });

  afterAll(async () => {
    await userModel.deleteMany({ email: new RegExp(uniquePrefix, 'i') });
    await productModel.deleteMany({ name: new RegExp(uniquePrefix, 'i') });
    await movementModel.deleteMany({
      reason: new RegExp(uniquePrefix, 'i'),
    });
    await app.close();
  });

  it('deve registrar ENTRADA aumentando o estoque do produto (POST /stock-movements)', async () => {
    const res = await request(server)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        productId: testProductId.toString(),
        type: MovementType.ENTRADA,
        quantity: 10,
        reason: `${uniquePrefix} Entrada de reposição fornecedor`,
      });

    expect(res.status).toBe(201);
    const body = res.body as MovementResponseBody;
    expect(body.type).toBe(MovementType.ENTRADA);
    expect(body.quantity).toBe(10);

    const updatedProd = await productModel.findById(testProductId);
    expect(updatedProd?.currentStock).toBe(30); // 20 + 10
  });

  it('deve registrar SAIDA diminuindo o estoque do produto (POST /stock-movements)', async () => {
    const res = await request(server)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        productId: testProductId.toString(),
        type: MovementType.SAIDA,
        quantity: 3,
        reason: `${uniquePrefix} Saída de balcão drink`,
      });

    expect(res.status).toBe(201);
    const body = res.body as MovementResponseBody;
    expect(body.type).toBe(MovementType.SAIDA);
    expect(body.quantity).toBe(3);

    const updatedProd = await productModel.findById(testProductId);
    expect(updatedProd?.currentStock).toBe(27); // 30 - 3
  });

  it('deve registrar PERDA diminuindo o estoque do produto (POST /stock-movements)', async () => {
    const res = await request(server)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        productId: testProductId.toString(),
        type: MovementType.PERDA,
        quantity: 1,
        reason: `${uniquePrefix} Quebra acidental no balcão`,
      });

    expect(res.status).toBe(201);
    const body = res.body as MovementResponseBody;
    expect(body.type).toBe(MovementType.PERDA);

    const updatedProd = await productModel.findById(testProductId);
    expect(updatedProd?.currentStock).toBe(26); // 27 - 1
  });

  it('deve registrar AJUSTE manual de contagem definindo novo estoque (POST /stock-movements)', async () => {
    const res = await request(server)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        productId: testProductId.toString(),
        type: MovementType.AJUSTE,
        quantity: 50,
        reason: `${uniquePrefix} Inventário mensal físico`,
      });

    expect(res.status).toBe(201);
    const body = res.body as MovementResponseBody;
    expect(body.type).toBe(MovementType.AJUSTE);

    const updatedProd = await productModel.findById(testProductId);
    expect(updatedProd?.currentStock).toBe(50);
  });

  it('deve rejeitar tipo de movimentação inválido com 400 Bad Request', async () => {
    const res = await request(server)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        productId: testProductId.toString(),
        type: 'TIPO_INVENTADO',
        quantity: 5,
      });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar productId em formato inválido com 400 Bad Request via ParseObjectIdPipe', async () => {
    const res = await request(server)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        productId: 'produto-id-invalido',
        type: MovementType.ENTRADA,
        quantity: 5,
      });

    expect(res.status).toBe(400);
  });

  it('deve listar todas as movimentações populando produto e usuário (GET /stock-movements)', async () => {
    const res = await request(server)
      .get('/stock-movements')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    const body = res.body as MovementResponseBody[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(4);
    const lastMov = body[0];
    expect(lastMov).toHaveProperty('productId');
    expect(lastMov).toHaveProperty('userId');
  });
});
