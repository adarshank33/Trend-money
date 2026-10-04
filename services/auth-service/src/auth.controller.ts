import {Body,Controller, HttpCode, HttpStatus, Get, Post, Req, Res, UnauthorizedException} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.register(dto);
    this.setToken(res, result.token);

    return {
      message: result.message,
      user: result.user
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(dto);
    this.setToken(res, result.token);

    return {
      message: result.message,
      user: result.user
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out' };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const userId = req.headers['x-user-id'];

    if (!userId || Array.isArray(userId)) {
      throw new UnauthorizedException('Authentication required');
    }

    return this.authService.me(userId);
  }

  private setToken(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });
  }
}
