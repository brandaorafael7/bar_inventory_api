import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // 1. Valida se a categoria informada realmente existe
    await this.categoriesService.findOne(createProductDto.categoryId);

    // 2. Se informou código de barras, valida se não está duplicado
    if (createProductDto.barcode) {
      const existingBarcode = await this.productModel.findOne({
        barcode: createProductDto.barcode,
        isActive: true,
      });
      if (existingBarcode) {
        throw new BadRequestException('Já existe um produto ativo com esse código de barras.');
      }
    }

    const newProduct = new this.productModel(createProductDto);
    return newProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel
      .find({ isActive: true })
      .populate('categoryId', 'name')
      .exec();
  }

  async findLowStock(): Promise<Product[]> {
    // Retorna todos os produtos cujo estoque atual é menor ou igual ao estoque mínimo
    return this.productModel
      .find({
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStock'] },
      })
      .populate('categoryId', 'name')
      .exec();
  }

  async findOne(id: string): Promise<Product> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name')
      .exec();

    if (!product || !product.isActive) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('categoryId', 'name')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de produto inválido.');
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return { message: 'Produto desativado com sucesso.' };
  }
}