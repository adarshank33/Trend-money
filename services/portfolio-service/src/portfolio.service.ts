import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Holding,
  Portfolio,
  PortfolioDocument
} from './portfolio.schema';
import { ProcessedEvent, ProcessedEventDocument } from './processed-event.schema';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(Portfolio.name)
    private readonly portfolioModel: Model<PortfolioDocument>,
    @InjectModel(ProcessedEvent.name)
    private readonly eventModel: Model<ProcessedEventDocument>
  ) {}

  async get(userId: string) {
    try {
      const portfolio = await this.portfolioModel.findOne({ userId });

      if (!portfolio) {
        return {
          totalInvested: 0,
          currentValue: 0,
          profitLoss: 0,
          holdings: []
        };
      }

      return portfolio;
    } catch {
      throw new InternalServerErrorException(
        'Unable to fetch portfolio'
      );
    }
  }

  async holdings(userId: string) {
    const portfolio = await this.get(userId);
    return portfolio.holdings;
  }

  async handleCompleted(event: any) {
    try {
      await this.eventModel.create({
        eventId: event.eventId,
        eventType: 'ORDER_COMPLETED'
      });
    } catch (error) {
      if ((error as any)?.code === 11000) {
        return;
      }

      throw error;
    }

    try {
      let portfolio = await this.portfolioModel.findOne({
        userId: event.userId
      });

      if (!portfolio) {
        portfolio = await this.portfolioModel.create({
          userId: event.userId,
          holdings: []
        });
      }

      const holdings = portfolio.holdings as Holding[];
      const index = holdings.findIndex(
        (holding) => holding.productId === event.productId
      );
      const existing = index >= 0 ? holdings[index] : null;

      if (event.type === 'BUY') {
        if (existing) {
          const quantity = existing.quantity + event.quantity;
          const investedAmount =
            existing.investedAmount + event.amount;

          existing.quantity = quantity;
          existing.investedAmount = investedAmount;
          existing.averageBuyPrice = investedAmount / quantity;
          existing.currentPrice = event.price;
          existing.currentValue = quantity * event.price;
        } else {
          holdings.push({
            productId: event.productId,
            productName: event.productName,
            quantity: event.quantity,
            averageBuyPrice: event.price,
            currentPrice: event.price,
            investedAmount: event.amount,
            currentValue: event.amount
          });
        }
      }

      portfolio.holdings = holdings;
      portfolio.totalInvested = holdings.reduce(
        (sum, holding) => sum + holding.investedAmount,
        0
      );
      portfolio.currentValue = holdings.reduce(
        (sum, holding) => sum + holding.currentValue,
        0
      );
      portfolio.profitLoss =
        portfolio.currentValue - portfolio.totalInvested;

      await portfolio.save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Unable to update portfolio'
      );
    }
  }
}
