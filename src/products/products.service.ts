import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(createProductDto.category)) {
      throw new BadRequestException('ID de categoria inválido.');
    }

    await this.categoriesService.findOne(createProductDto.category);

    const createdProduct = new this.productModel({
      ...createProductDto,
      category: new Types.ObjectId(createProductDto.category),
    });

    return createdProduct.save();
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isActive: true })
      .populate('category', 'name')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category', 'name')
      .exec();

    if (!product || !product.isActive) {
      throw new NotFoundException(`Produto #${id} não encontrado.`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    if (updateProductDto.category) {
      if (!Types.ObjectId.isValid(updateProductDto.category)) {
        throw new BadRequestException('ID de categoria inválido.');
      }
      await this.categoriesService.findOne(updateProductDto.category);
    }

    const updateData: any = { ...updateProductDto };
    if (updateProductDto.category) {
      updateData.category = new Types.ObjectId(updateProductDto.category);
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Produto #${id} não encontrado.`);
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!product) {
      throw new NotFoundException(`Produto #${id} não encontrado.`);
    }

    return product;
  }
}