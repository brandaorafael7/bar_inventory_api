import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('stock-movements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @ApiOperation({ summary: 'Registra uma nova movimentação de estoque' })
  @ApiResponse({
    status: 201,
    description: 'Movimentação registrada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente ou dados inválidos.',
  })
  create(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.stockMovementsService.create(
      createStockMovementDto,
      user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as movimentações de estoque' })
  findAll() {
    return this.stockMovementsService.findAll();
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lista as movimentações de um determinado produto' })
  @ApiResponse({
    status: 200,
    description: 'Movimentações do produto retornadas.',
  })
  @ApiResponse({ status: 400, description: 'ID de produto inválido.' })
  findByProduct(@Param('productId', ParseObjectIdPipe) productId: string) {
    return this.stockMovementsService.findByProduct(productId);
  }
}
