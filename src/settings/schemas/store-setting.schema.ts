import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoreSettingDocument = HydratedDocument<StoreSetting>;

@Schema({ timestamps: true })
export class StoreSetting {
  @Prop({ type: String, required: true, default: 'Bar & Tabacaria' })
  storeName!: string;

  @Prop({ type: String, default: null })
  logoUrl?: string;

  @Prop({ type: String, default: null })
  phone?: string;

  @Prop({ type: String, default: '#f59e0b' }) // Cor padrão (Amber)
  primaryColor?: string;
}

export const StoreSettingSchema = SchemaFactory.createForClass(StoreSetting);