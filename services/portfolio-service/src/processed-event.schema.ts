import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProcessedEventDocument = HydratedDocument<ProcessedEvent>;

@Schema({ timestamps: true })
export class ProcessedEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;
}

export const ProcessedEventSchema =
  SchemaFactory.createForClass(ProcessedEvent);
