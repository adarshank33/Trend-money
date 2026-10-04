import {
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { OrderService } from './order.service';

describe('OrderService', () => {
  beforeEach(() => {
    process.env.PRODUCT_SERVICE_URL = 'http://product-service:3002';
  });

  it('creates a pending order and publishes ORDER_CREATED', async () => {
    const created = {
      _id: 'order-1',
      userId: 'user-1',
      productId: 'product-1',
      productName: 'Fund',
      productSymbol: 'FND',
      type: 'BUY',
      quantity: 2,
      price: 100,
      amount: 200,
      status: 'PENDING'
    };

    const model: any = {
      create: jest.fn().mockResolvedValue(created)
    };
    const kafka: any = {
      setProcessor: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined)
    };

    const oldFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        _id: 'product-1',
        name: 'Fund',
        symbol: 'FND',
        currentPrice: 100,
        status: true
      })
    }) as any;

    const service = new OrderService(model, kafka);
    const result = await service.create('user-1', {
      productId: 'product-1',
      type: 'BUY',
      quantity: 2
    });

    expect(result.status).toBe('PENDING');
    expect(kafka.publish).toHaveBeenCalled();

    global.fetch = oldFetch;
  });

  it('returns 404 when an order does not exist', async () => {
    const model: any = {
      findById: jest.fn().mockResolvedValue(null)
    };
    const kafka: any = { setProcessor: jest.fn() };
    const service = new OrderService(model, kafka);

    await expect(
      service.findOne('user-1', 'order-1')
    ).rejects.toThrow(NotFoundException);
  });

  it('returns 403 when an order belongs to another user', async () => {
    const model: any = {
      findById: jest.fn().mockResolvedValue({
        _id: 'order-1',
        userId: 'user-2'
      })
    };
    const kafka: any = { setProcessor: jest.fn() };
    const service = new OrderService(model, kafka);

    await expect(
      service.findOne('user-1', 'order-1')
    ).rejects.toThrow(ForbiddenException);
  });
});
