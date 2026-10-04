import { BadGatewayException, BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { CreateOrderDto, ListOrderDto } from './order.dto';
import { Order, OrderDocument } from './order.schema';
import { KafkaService, TOPICS } from './kafka.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly kafka: KafkaService
  ) {
    this.kafka.setProcessor(
      this.processCreatedEvent.bind(this)
    );
  }

  async create(userId: string, dto: CreateOrderDto) {
    let product: any;

    try {
      const response = await fetch(
        `${process.env.PRODUCT_SERVICE_URL}/products/${dto.productId}`
      );

      if (response.status === 404) {
        throw new BadRequestException('Invalid product');
      }

      if (!response.ok) {
        throw new BadGatewayException('Product service unavailable');
      }

      product = await response.json();
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      throw new BadGatewayException('Product service unavailable');
    }

    if (!product.status) {
      throw new BadRequestException('Product is inactive');
    }

    try {
      const order = await this.orderModel.create({
        userId,
        productId: product._id,
        productName: product.name,
        productSymbol: product.symbol,
        type: dto.type,
        quantity: dto.quantity,
        price: product.currentPrice,
        amount: Number(
          (product.currentPrice * dto.quantity).toFixed(2)
        ),
        status: 'PENDING'
      });

      await this.kafka.publish(TOPICS.CREATED, this.event(order));

      return order;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to create order'
      );
    }
  }

  async findAll(userId: string, query: ListOrderDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(query.limit) || 10, 1),
      50
    );
    const filter: any = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    try {
      const [items, total] = await Promise.all([
        this.orderModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        this.orderModel.countDocuments(filter)
      ]);

      return {
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch {
      throw new InternalServerErrorException('Unable to fetch orders');
    }
  }

  async findOne(userId: string, id: string) {
    let order: OrderDocument | null;

    try {
      order = await this.orderModel.findById(id);
    } catch (error) {
      if ((error as any)?.name === 'CastError') {
        throw new BadRequestException('Invalid order id');
      }

      throw new InternalServerErrorException('Unable to fetch order');
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async cancel(userId: string, id: string) {
    const order = await this.findOne(userId, id);

    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    try {
      order.status = 'CANCELLED';
      await order.save();
      return order;
    } catch {
      throw new InternalServerErrorException(
        'Unable to cancel order'
      );
    }
  }

  async processCreatedEvent(event: any) {
    let order: OrderDocument | null;

    try {
      order = await this.orderModel.findById(event.orderId);
    } catch {
      return;
    }

    if (!order || order.status === 'CANCELLED') {
      return;
    }

    if (order.status !== 'PENDING') {
      return;
    }

    try {
      order.status = 'PROCESSING';
      await order.save();
      await this.kafka.publish(
        TOPICS.PROCESSING,
        this.event(order)
      );

      await new Promise((resolve) => setTimeout(resolve, 60000));

      const latestOrder = await this.orderModel.findById(event.orderId);

      if (!latestOrder || latestOrder.status === 'CANCELLED') {
        return;
      }

      latestOrder.status = 'COMPLETED';
      await latestOrder.save();
      await this.kafka.publish(
        TOPICS.COMPLETED,
        this.event(latestOrder)
      );
    } catch {
      try {
        order.status = 'FAILED';
        order.failureReason = 'Order processing failed';
        await order.save();
        await this.kafka.publish(
          TOPICS.FAILED,
          this.event(order)
        );
      } catch {
        this.loggerError('Failed to publish order failure');
      }
    }
  }

  private event(order: OrderDocument) {
    return {
      eventId: randomUUID(),
      orderId: order._id.toString(),
      userId: order.userId,
      productId: order.productId,
      productName: order.productName,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      amount: order.amount
    };
  }

  private loggerError(message: string) {
    console.error(message);
  }
}
