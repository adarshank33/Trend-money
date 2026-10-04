import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PortfolioDocument = HydratedDocument<Portfolio>;

@Schema({ _id: false })
export class Holding {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  averageBuyPrice: number;

  @Prop({ required: true })
  currentPrice: number;

  @Prop({ required: true })
  investedAmount: number;

  @Prop({ required: true })
  currentValue: number;
}

@Schema({ timestamps: true })
export class Portfolio {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: 0 })
  totalInvested: number;

  @Prop({ default: 0 })
  currentValue: number;

  @Prop({ default: 0 })
  profitLoss: number;

  @Prop({ type: [Holding], default: [] })
  holdings: Holding[];
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);
