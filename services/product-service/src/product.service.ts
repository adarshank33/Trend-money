import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>
  ) {}

  async findAll(query: any) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(query.limit) || 10, 1),
      50
    );

    const filter: FilterQuery<ProductDocument> = {};

    if (query.search) {
      const search = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { symbol: new RegExp(search, 'i') }
      ];
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    try {
      const [items, total] = await Promise.all([
        this.productModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        this.productModel.countDocuments(filter)
      ]);

      return {
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch {
      throw new InternalServerErrorException('Unable to fetch products');
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if ((error as any)?.name === 'CastError') {
        throw new BadRequestException('Invalid product id');
      }

      throw new InternalServerErrorException('Unable to fetch product');
    }
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.productModel.create(dto);
    } catch (error) {
      if ((error as any)?.code === 11000) {
        throw new ConflictException('Product symbol already exists');
      }

      throw new InternalServerErrorException('Unable to create product');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.productModel.findByIdAndUpdate(
        id,
        dto,
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if ((error as any)?.name === 'CastError') {
        throw new BadRequestException('Invalid product id');
      }

      throw new InternalServerErrorException('Unable to update product');
    }
  }
}
