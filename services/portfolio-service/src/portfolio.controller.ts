import {
  Controller,
  Get,
  Headers,
  UnauthorizedException
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  private getUserId(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return userId;
  }

  @Get()
  get(@Headers('x-user-id') userId: string) {
    return this.portfolioService.get(this.getUserId(userId));
  }

  @Get('holdings')
  holdings(@Headers('x-user-id') userId: string) {
    return this.portfolioService.holdings(
      this.getUserId(userId)
    );
  }
}
