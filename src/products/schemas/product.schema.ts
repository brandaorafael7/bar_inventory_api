import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  barcode?: string;

  @Prop({ type: Types.ObjectId, ref: Category.name, default: null })
  category: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  dayPrice: number;

  @Prop({ default: 0, min: 0 })
  eventPrice: number;

  @Prop({ default: 0, min: 0 })
  costPrice: number;

  @Prop({ required: true, min: 0, default: 0 })
  currentStock: number;

  @Prop({ default: 5, min: 0 })
  minStock: number;

  @Prop({ default: 'un', trim: true })
  unit: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);