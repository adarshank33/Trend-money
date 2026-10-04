import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException
} from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { PortfolioService } from './portfolio.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID as string,
    brokers: (process.env.KAFKA_BROKERS as string).split(',')
  });
  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID as string
  });

  constructor(private readonly portfolioService: PortfolioService) {}

  async onModuleInit() {
    for (let attempt = 1; attempt <= 20; attempt++) {
      try {
        await this.consumer.connect();
        await this.consumer.subscribe({
          topic: process.env.KAFKA_TOPIC_ORDER_COMPLETED as string,
          fromBeginning: false
        });

        await this.consumer.run({
          eachMessage: async ({ message }: any) => {
            if (!message.value) {
              return;
            }

            await this.portfolioService.handleCompleted(
              JSON.parse(message.value.toString())
            );
          }
        });

        this.logger.log('Kafka connected');
        return;
      } catch {
        this.logger.warn(
          `Kafka connection attempt ${attempt} failed`
        );

        if (attempt === 20) {
          throw new ServiceUnavailableException(
            'Kafka unavailable'
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
