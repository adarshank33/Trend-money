import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('returns an empty portfolio for a new user', async () => {
    const portfolioModel: any = {
      findOne: jest.fn().mockResolvedValue(null)
    };
    const eventModel: any = {};
    const service = new PortfolioService(
      portfolioModel,
      eventModel
    );

    await expect(service.get('user-1')).resolves.toEqual({
      totalInvested: 0,
      currentValue: 0,
      profitLoss: 0,
      holdings: []
    });
  });

  it('ignores a duplicate completed event', async () => {
    const portfolioModel: any = {
      findOne: jest.fn()
    };
    const eventModel: any = {
      create: jest.fn().mockRejectedValue({ code: 11000 })
    };
    const service = new PortfolioService(
      portfolioModel,
      eventModel
    );

    await service.handleCompleted({
      eventId: 'event-1',
      userId: 'user-1',
      productId: 'product-1',
      productName: 'Fund',
      type: 'BUY',
      quantity: 1,
      price: 100,
      amount: 100
    });

    expect(portfolioModel.findOne).not.toHaveBeenCalled();
  });
});
