import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.isActive) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user.toObject();
        return result;
      }
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    // Chave para definir se a conta é de Administrador
    const validAdminKey = process.env.ADMIN_REGISTRATION_KEY || 'bar-admin-2026';
    const role = dto.adminKey === validAdminKey ? Role.ADMIN : Role.EMPLOYEE;

    const newUser = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role,
    });

    const newUserId = String((newUser as unknown as { _id: unknown })._id);
    const payload = { sub: newUserId, email: newUser.email, role: newUser.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: newUserId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }
}