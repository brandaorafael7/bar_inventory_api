import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../schemas/stock-movement.schema';

export class CreateStockMovementDto {
  @ApiProperty({ example: '65f... (ID do Produto)' })
  @IsMongoId({ message: 'O ID do produto deve ser válido.' })
  @IsNotEmpty({ message: 'O produto é obrigatório.' })
  productId: string;

  @ApiProperty({ enum: MovementType, example: MovementType.ENTRADA })
  @IsEnum(MovementType, { message: 'Tipo inválido. Use: ENTRADA, SAIDA, PERDA ou AJUSTE.' })
  @IsNotEmpty({ message: 'O tipo de movimentação é obrigatório.' })
  type: MovementType;

  @ApiProperty({ example: 12, description: 'Quantidade movimentada' })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'A quantidade deve ser maior que zero.' })
  quantity: number;

  @ApiPropertyOptional({ example: 'Chegada de pedido de reposição da distribuidora' })
  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto.' })
  reason?: string;
}