import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const model: any = {
    findOne: jest.fn(),
    create: jest.fn()
  };

  const service = new AuthService(model);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns 409 when email already exists', async () => {
    model.findOne.mockResolvedValue({ _id: '1' });

    await expect(
      service.register({
        name: 'A',
        email: 'a@example.com',
        password: 'secret'
      })
    ).rejects.toThrow(ConflictException);
  });

  it('returns 401 for invalid credentials', async () => {
    model.findOne.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'a@example.com',
        password: 'secret'
      })
    ).rejects.toThrow(UnauthorizedException);
  });
});
