import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.category) {
      if (!Types.ObjectId.isValid(createProductDto.category)) {
        throw new BadRequestException('ID de categoria inválido.');
      }
      await this.categoriesService.findOne(createProductDto.category);
    }

    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel
      .find({ isActive: true })
      .populate('category')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category')
      .exec();

    if (!product || !product.isActive) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    if (updateProductDto.category) {
      if (!Types.ObjectId.isValid(updateProductDto.category)) {
        throw new BadRequestException('ID de categoria inválido.');
      }
      await this.categoriesService.findOne(updateProductDto.category);
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('category')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    return { message: 'Produto desativado com sucesso.' };
  }

  async findLowStock(): Promise<Product[]> {
    return this.productModel
      .find({
        isActive: true,
        $expr: {$lte: ['$currentStock', '$minStock'] },
      })
      .populate('category')
      .sort({ currentStock: 1 })
      .exec();
  }
}