import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({
    required: true,
    enum: ['MUTUAL_FUND', 'STOCK', 'BOND', 'ETF']
  })
  type: string;

  @Prop({ required: true, min: 0 })
  currentPrice: number;

  @Prop({
    required: true,
    enum: ['LOW', 'MODERATE', 'HIGH']
  })
  riskLevel: string;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  })
  status: string;

}

export const ProductSchema = SchemaFactory.createForClass(Product);
