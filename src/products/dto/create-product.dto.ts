import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Cigarro Marlboro Red' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '65f...' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  currentStock!: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  minStock!: number;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 15.0 })
  @IsNumber()
  @Min(0)
  sellPrice!: number;

  @ApiPropertyOptional({ example: true, description: 'Possui preço diferenciado na madrugada' })
  @IsOptional()
  @IsBoolean()
  hasNightPrice?: boolean;

  @ApiPropertyOptional({ example: 18.0, description: 'Preço pós-meia-noite' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightSellPrice?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Preço de 1 cigarro avulso na madrugada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightUnitSellPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowUnitSale?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  unitsPerPack?: number;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  unitSellPrice?: number;
}