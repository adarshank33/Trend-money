import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsEnum(['MUTUAL_FUND', 'STOCK', 'BOND', 'ETF'])
  type: string;

  @IsNumber()
  @Min(0)
  currentPrice: number;

  @IsEnum(['LOW', 'MODERATE', 'HIGH'])
  riskLevel: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @IsOptional()
  @IsEnum(['LOW', 'MODERATE', 'HIGH'])
  riskLevel?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: string;
}
