import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Cerveja Corona' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: '64b1f2e8...' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 12.0 })
  @IsNumber()
  @Min(0)
  dayPrice: number;

  @ApiPropertyOptional({ example: 15.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  eventPrice?: number;

  @ApiPropertyOptional({ example: 8.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 'un' })
  @IsString()
  @IsOptional()
  unit?: string;
}