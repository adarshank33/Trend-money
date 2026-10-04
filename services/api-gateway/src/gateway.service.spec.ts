import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { of } from 'rxjs';
import * as jwt from 'jsonwebtoken';

import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;
  let http: HttpService;

  beforeEach(() => {
    http = {
      request: jest.fn()
    } as unknown as HttpService;

    service = new GatewayService(http);

    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticate', () => {
    it('rejects request without token', () => {
      const req = {
        cookies: {},
        headers: {}
      } as unknown as Request;

      expect(() => service.authenticate(req))
        .toThrow(UnauthorizedException);
    });

    it('rejects invalid token', () => {
      const req = {
        cookies: {
          token: 'invalid-token'
        },
        headers: {}
      } as unknown as Request;

      expect(() => service.authenticate(req))
        .toThrow(UnauthorizedException);
    });

    it('returns userId for valid token', () => {
      const token = jwt.sign(
        { userId: 'user-123' },
        process.env.JWT_SECRET as string
      );

      const req = {
        cookies: {
          token
        },
        headers: {}
      } as unknown as Request;

      expect(service.authenticate(req)).toEqual({
        userId: 'user-123'
      });
    });
  });

  describe('forward', () => {
    it('does not forward protected request without authentication', async () => {
      const req = {
        cookies: {},
        headers: {},
        query: {}
      } as unknown as Request;

      await expect(
        service.forward(
          'GET',
          'http://service:3000/test',
          req
        )
      ).rejects.toThrow(UnauthorizedException);

      expect(http.request).not.toHaveBeenCalled();
    });

    it('forwards authenticated request with userId', async () => {
      const token = jwt.sign(
        { userId: 'user-123' },
        process.env.JWT_SECRET as string
      );

      (http.request as jest.Mock).mockReturnValue(
        of({
          status: 200,
          data: {},
          headers: {}
        })
      );

      const req = {
        cookies: {
          token
        },
        headers: {},
        query: {}
      } as unknown as Request;

      await service.forward(
        'GET',
        'http://service:3000/test',
        req
      );

      const request =
        (http.request as jest.Mock).mock.calls[0][0];

      expect(
        request.headers['x-user-id']
      ).toBe('user-123');
    });
  });
});