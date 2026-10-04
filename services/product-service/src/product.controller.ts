import {Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query, UnauthorizedException} from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateProductDto
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return this.productService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return this.productService.update(id, dto);
  }
}
