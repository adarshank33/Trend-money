import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './product.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }
    ])
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class AppModule {}
