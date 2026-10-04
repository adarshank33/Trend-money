import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productSymbol: string;

  @Prop({ required: true, enum: ['BUY'] })
  type: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  })
  status: string;

  @Prop()
  failureReason?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
