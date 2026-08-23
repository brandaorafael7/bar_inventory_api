import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Cerveja Heineken 330ml' })
  @IsString()
  @IsNotEmpty({ message: 'O nome do produto é obrigatório.' })
  name!: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  @IsString()
  @IsNotEmpty({ message: 'A categoria é obrigatória.' })
  category!: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 5.5 })
  @IsNumber()
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  costPrice!: number;

  @ApiProperty({ example: 9.0 })
  @IsNumber()
  @Min(0, { message: 'O preço diurno não pode ser negativo.' })
  dayPrice!: number;

  @ApiPropertyOptional({ example: 11.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightPrice?: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  currentStock!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 'un' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFractionable?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  unitsPerPack?: number;
}