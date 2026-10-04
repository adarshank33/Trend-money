import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { LoginDto, RegisterDto } from './auth.dto';
import { User, UserDocument } from './user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  async register(dto: RegisterDto) {
    try {
      const email = dto.email.toLowerCase();
      const existingUser = await this.userModel.findOne({ email });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const password = await bcrypt.hash(dto.password, 10);
      const user = await this.userModel.create({
        name: dto.name,
        email,
        phone: dto.phone,
        password
      });

      return {
        message: 'Registration successful',
        user: this.publicUser(user),
        token: this.sign(user)
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if ((error as any)?.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Unable to register user');
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.userModel.findOne({
        email: dto.email.toLowerCase()
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatches = await bcrypt.compare(
        dto.password,
        user.password
      );

      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return {
        message: 'Login successful',
        user: this.publicUser(user),
        token: this.sign(user)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Unable to login');
    }
  }

  async me(userId: string) {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.publicUser(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Unable to fetch user');
    }
  }

  sign(user: UserDocument) {
    return jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
  }

  private publicUser(user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone
    };
  }
}
