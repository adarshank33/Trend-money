import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  HttpException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

export type AuthUser = {
  userId: string;
};

@Injectable()
export class GatewayService {
  constructor(private readonly http: HttpService) {}

  authenticate(req: Request): AuthUser {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload & Partial<AuthUser>;

      if (!decoded.userId) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        userId: decoded.userId
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async forward(
    method: string,
    url: string,
    req: Request,
    res?: Response,
    body?: unknown,
    authenticated = true
  ) {
    const headers: Record<string, string> = {
      'content-type': 'application/json'
    };

    if (authenticated) {
      const user = this.authenticate(req);

      headers['x-user-id'] = user.userId;
    }

    try {
      const response = await firstValueFrom(
        this.http.request({
          method,
          url,
          data: body,
          params: req.query,
          headers,
          validateStatus: () => true
        })
      );

      const setCookie = response.headers['set-cookie'];

      if (setCookie && res) {
        res.setHeader('set-cookie', setCookie);
      }

      if (response.status >= 400) {
        throw new HttpException(
          response.data,
          response.status
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadGatewayException('Service unavailable');
    }
  }

  authUrl(path: string) {
    return `${process.env.AUTH_SERVICE_URL}${path}`;
  }

  productUrl(path: string) {
    return `${process.env.PRODUCT_SERVICE_URL}${path}`;
  }

  orderUrl(path: string) {
    return `${process.env.ORDER_SERVICE_URL}${path}`;
  }

  portfolioUrl(path: string) {
    return `${process.env.PORTFOLIO_SERVICE_URL}${path}`;
  }
}