import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { MovementType, StockMovement, StockMovementDocument } from './schemas/stock-movement.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name)
    private readonly stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateStockMovementDto, userId: string): Promise<StockMovement> {
    if (!isValidObjectId(dto.productId)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel.findById(dto.productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('Produto não encontrado ou inativo.');
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    switch (dto.type) {
      case MovementType.ENTRADA:
        newStock += dto.quantity;
        break;

      case MovementType.SAIDA:
      case MovementType.PERDA:
        if (previousStock < dto.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para esta operação. Estoque atual: ${previousStock}`,
          );
        }
        newStock -= dto.quantity;
        break;

      case MovementType.AJUSTE:
        newStock = dto.quantity;
        break;

      default:
        throw new BadRequestException('Tipo de movimentação inválido.');
    }

    product.currentStock = newStock;
    await product.save();

    const movement = new this.stockMovementModel({
      productId: new Types.ObjectId(dto.productId),
      userId: new Types.ObjectId(userId),
      type: dto.type,
      quantity: dto.quantity,
      previousStock,
      newStock,
      reason: dto.reason,
    });

    return movement.save();
  }

  async findAll(): Promise<StockMovement[]> {
    return this.stockMovementModel
      .find()
      .populate('productId', 'name barcode currentStock')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProduct(productId: string): Promise<StockMovement[]> {
    if (!isValidObjectId(productId)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    return this.stockMovementModel
      .find({ productId: new Types.ObjectId(productId) })
      .populate('productId', 'name')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }
}