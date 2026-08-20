import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryModel.findOne({
      name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
    });

    if (existingCategory) {
      throw new ConflictException('Já existe uma categoria cadastrada com esse nome.');
    }

    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Category> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID de categoria inválido.');
    }

    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID de categoria inválido.');
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException('Categoria não encontrada.');
    }
    return updatedCategory;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID de categoria inválido.');
    }

    // Soft delete: apenas desativa em vez de deletar fisicamente
    const category = await this.categoryModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return { message: 'Categoria desativada com sucesso.' };
  }
}