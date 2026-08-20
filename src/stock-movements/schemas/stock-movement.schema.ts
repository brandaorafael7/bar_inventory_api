import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type StockMovementDocument = HydratedDocument<StockMovement>;

export enum MovementType {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  PERDA = 'PERDA',
  AJUSTE = 'AJUSTE',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class StockMovement {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
  productId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: MovementType, required: true })
  type!: MovementType;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true })
  previousStock!: number;

  @Prop({ type: Number, required: true })
  newStock!: number;

  @Prop({ type: String, trim: true, default: null })
  reason?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);