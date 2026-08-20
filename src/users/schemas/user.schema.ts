import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: true })
  password!: string;

  @Prop({ type: String, enum: Role, default: Role.EMPLOYEE })
  role!: Role;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);