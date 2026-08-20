import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('stock-movements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  create(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.stockMovementsService.create(createStockMovementDto, user.userId);
  }

  @Get()
  findAll() {
    return this.stockMovementsService.findAll();
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.stockMovementsService.findByProduct(productId);
  }
}