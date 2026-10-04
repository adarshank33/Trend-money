import {Body,Controller,Get,Headers,HttpCode,HttpStatus,Param,Post,Query,UnauthorizedException} from '@nestjs/common';
import { CreateOrderDto, ListOrderDto } from './order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private getUserId(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateOrderDto
  ) {
    return this.orderService.create(this.getUserId(userId), dto);
  }

  @Get()
  findAll(
    @Headers('x-user-id') userId: string,
    @Query() query: ListOrderDto
  ) {
    return this.orderService.findAll(
      this.getUserId(userId),
      query
    );
  }

  @Get(':id')
  findOne(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string
  ) {
    return this.orderService.findOne(
      this.getUserId(userId),
      id
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string
  ) {
    return this.orderService.cancel(
      this.getUserId(userId),
      id
    );
  }
}
