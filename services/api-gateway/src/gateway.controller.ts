import { Body, Controller, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';
import {
  RegisterSwaggerDto,
  LoginSwaggerDto,
  CreateProductSwaggerDto,
  UpdateProductSwaggerDto,
  CreateOrderSwaggerDto
} from './swagger.dto';

@Controller()
export class GatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Post('auth/register')
  register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RegisterSwaggerDto
  ) {
    return this.gateway.forward(
      'POST',
      this.gateway.authUrl('/auth/register'),
      req,
      res,
      body,
      false
    );
  }

  @Post('auth/login')
  login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginSwaggerDto
  ) {
    return this.gateway.forward(
      'POST',
      this.gateway.authUrl('/auth/login'),
      req,
      res,
      body,
      false
    );
  }

  @Post('auth/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.gateway.forward(
      'POST',
      this.gateway.authUrl('/auth/logout'),
      req,
      res,
      {},
      false
    );
  }

  @Get('auth/me')
  me(@Req() req: Request) {
    return this.gateway.forward(
      'GET',
      this.gateway.authUrl('/auth/me'),
      req
    );
  }

  @Get('products')
  products(@Req() req: Request) {
    return this.gateway.forward(
      'GET',
      this.gateway.productUrl('/products'),
      req
    );
  }

  @Get('products/:id')
  product(@Req() req: Request, @Param('id') id: string) {
    return this.gateway.forward(
      'GET',
      this.gateway.productUrl(`/products/${id}`),
      req
    );
  }

  @Post('products')
  createProduct(@Req() req: Request, @Body() body: CreateProductSwaggerDto) {
    return this.gateway.forward(
      'POST',
      this.gateway.productUrl('/products'),
      req,
      undefined,
      body
    );
  }

  @Patch('products/:id')
  updateProduct(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateProductSwaggerDto
  ) {
    return this.gateway.forward(
      'PATCH',
      this.gateway.productUrl(`/products/${id}`),
      req,
      undefined,
      body
    );
  }

  @Post('orders')
  createOrder(@Req() req: Request, @Body() body: CreateOrderSwaggerDto) {
    return this.gateway.forward(
      'POST',
      this.gateway.orderUrl('/orders'),
      req,
      undefined,
      body
    );
  }

  @Get('orders')
  orders(@Req() req: Request) {
    return this.gateway.forward(
      'GET',
      this.gateway.orderUrl('/orders'),
      req
    );
  }

  @Get('orders/:id')
  order(@Req() req: Request, @Param('id') id: string) {
    return this.gateway.forward(
      'GET',
      this.gateway.orderUrl(`/orders/${id}`),
      req
    );
  }

  @Post('orders/:id/cancel')
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.gateway.forward(
      'POST',
      this.gateway.orderUrl(`/orders/${id}/cancel`),
      req
    );
  }

  @Get('portfolio')
  portfolio(@Req() req: Request) {
    return this.gateway.forward(
      'GET',
      this.gateway.portfolioUrl('/portfolio'),
      req
    );
  }

  @Get('portfolio/holdings')
  holdings(@Req() req: Request) {
    return this.gateway.forward(
      'GET',
      this.gateway.portfolioUrl('/portfolio/holdings'),
      req
    );
  }
}
