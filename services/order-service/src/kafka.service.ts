import {Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException} from '@nestjs/common';
import { Consumer, Kafka, Producer } from 'kafkajs';

export const TOPICS = {
  CREATED: process.env.KAFKA_TOPIC_ORDER_CREATED as string,
  PROCESSING: process.env.KAFKA_TOPIC_ORDER_PROCESSING as string,
  COMPLETED: process.env.KAFKA_TOPIC_ORDER_COMPLETED as string,
  FAILED: process.env.KAFKA_TOPIC_ORDER_FAILED as string
};

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID as string,
    brokers: (process.env.KAFKA_BROKERS as string).split(',')
  });
  private readonly producer: Producer = this.kafka.producer();
  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID as string
  });
  private processor?: (event: any) => Promise<void>;

  setProcessor(processor: (event: any) => Promise<void>) {
    this.processor = processor;
  }

  async onModuleInit() {
    for (let attempt = 1; attempt <= 20; attempt++) {
      try {
        await this.producer.connect();
        await this.consumer.connect();
        await this.consumer.subscribe({
          topic: TOPICS.CREATED,
          fromBeginning: false
        });

        await this.consumer.run({
          eachMessage: async ({ message }: any) => {
            if (!message.value || !this.processor) {
              return;
            }

            await this.processor(
              JSON.parse(message.value.toString())
            );
          }
        });

        this.logger.log('Kafka connected');
        return;
      } catch (error) {
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

  async publish(topic: string, payload: any) {
    await this.producer.send({
      topic,
      messages: [
        {
          key: payload.orderId,
          value: JSON.stringify(payload)
        }
      ]
    });
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.producer.disconnect(),
      this.consumer.disconnect()
    ]);
  }
}
