import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { KafkaService } from './kafka.service';
import { Portfolio, PortfolioSchema } from './portfolio.schema';
import {
  ProcessedEvent,
  ProcessedEventSchema
} from './processed-event.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    MongooseModule.forFeature([
      { name: Portfolio.name, schema: PortfolioSchema },
      {
        name: ProcessedEvent.name,
        schema: ProcessedEventSchema
      }
    ])
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService, KafkaService]
})
export class AppModule {}
