import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true })
  categoryId!: Category;

  @Prop({ type: String, trim: true, default: null })
  barcode?: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  currentStock!: number;

  @Prop({ type: Number, required: true, min: 0, default: 5 })
  minStock!: number;

  @Prop({ type: Number, required: true, min: 0 })
  costPrice!: number;

  @Prop({ type: Number, required: true, min: 0 })
  sellPrice!: number;

  // --- Preços Noturnos (Pós-meia-noite) ---
  @Prop({ type: Boolean, default: false })
  hasNightPrice?: boolean;

  @Prop({ type: Number, default: null })
  nightSellPrice?: number; // Preço do item/maço na madrugada

  @Prop({ type: Number, default: null })
  nightUnitSellPrice?: number; // Preço do cigarro avulso na madrugada

  // --- Venda Fracionada (Cigarros) ---
  @Prop({ type: Boolean, default: false })
  allowUnitSale?: boolean;

  @Prop({ type: Number, default: 1 })
  unitsPerPack?: number;

  @Prop({ type: Number, default: null })
  unitSellPrice?: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);