import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category!: Types.ObjectId;

  @Prop({ trim: true })
  barcode?: string;

  @Prop({ required: true, min: 0 })
  costPrice!: number;

  @Prop({ required: true, min: 0 })
  dayPrice!: number;

  @Prop({ min: 0 })
  nightPrice?: number;

  @Prop({ required: true, default: 0 })
  currentStock!: number;

  @Prop({ default: 5, min: 0 })
  minStock!: number;

  @Prop({ default: 'un' })
  unit!: string;

  @Prop({ default: false })
  isFractionable!: boolean;

  @Prop({ min: 1 })
  unitsPerPack?: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);