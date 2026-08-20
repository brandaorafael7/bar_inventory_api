import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'O nome da categoria deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório.' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  name!: string;
}