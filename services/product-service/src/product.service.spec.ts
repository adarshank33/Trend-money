import { NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';

describe('ProductService', () => {
  it('returns paginated products', async () => {
    const model: any = {
      find: jest.fn().mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ['p1']
          })
        })
      }),
      countDocuments: jest.fn().mockResolvedValue(1)
    };

    const service = new ProductService(model);
    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.items).toEqual(['p1']);
  });

  it('returns 404 when a product does not exist', async () => {
    const model: any = {
      findById: jest.fn().mockResolvedValue(null)
    };

    const service = new ProductService(model);

    await expect(service.findOne('missing')).rejects.toThrow(
      NotFoundException
    );
  });
});
