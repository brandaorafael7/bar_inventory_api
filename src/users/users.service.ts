import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const createdUser = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).select('-password').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), isActive: true }).exec();
  }

  async findOne(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID de usuário inválido.');
    }

    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user || !user.isActive) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID de usuário inválido.');
    }

    const user = await this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return { message: 'Usuário desativado com sucesso.' };
  }
}