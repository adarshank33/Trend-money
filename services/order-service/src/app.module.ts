import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { KafkaService } from './kafka.service';
import { Order, OrderSchema } from './order.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema }
    ])
  ],
  controllers: [OrderController],
  providers: [OrderService, KafkaService]
})
export class AppModule {}
