import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cadastra um novo produto (Apenas ADMIN)' })
  @ApiResponse({ status: 201, description: 'Produto cadastrado com sucesso.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos ativos' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Lista produtos que atingiram ou estão abaixo do estoque mínimo' })
  findLowStock() {
    return this.productsService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de um produto pelo ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de um produto (Apenas ADMIN)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa um produto do catálogo (Apenas ADMIN)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}