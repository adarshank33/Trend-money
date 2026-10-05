import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterSwaggerDto {
    @ApiProperty({ example: 'Adarsh Sahu' })
    name: string;

    @ApiProperty({ example: 'adarsh@example.com' })
    email: string;

    @ApiProperty({ example: '9999999999' })
    phone: string;

    @ApiProperty({ example: 'Password123' })
    password: string;
}

export class LoginSwaggerDto {
    @ApiProperty({ example: 'adarsh@example.com' })
    email: string;

    @ApiProperty({ example: 'Password123' })
    password: string;
}

export class CreateProductSwaggerDto {
    @ApiProperty({ example: 'ICICI Prudential Technology Fund' })
    name: string;

    @ApiProperty({ example: 'ICICITECH' })
    symbol: string;

    @ApiProperty({ enum: ['MUTUAL_FUND', 'STOCK', 'BOND', 'ETF'], example: 'MUTUAL_FUND' })
    type: string;

    @ApiProperty({ example: 1450.75 })
    currentPrice: number;

    @ApiProperty({ enum: ['LOW', 'MODERATE', 'HIGH'], example: 'HIGH' })
    riskLevel: string;

    @ApiPropertyOptional({ example: true, description: 'Whether the product is active' })
    status?: boolean;
}

export class UpdateProductSwaggerDto {
    @ApiPropertyOptional({ example: 'ICICI Tech Fund Balanced' })
    name?: string;

    @ApiPropertyOptional({ example: 1485.20 })
    currentPrice?: number;

    @ApiPropertyOptional({ enum: ['LOW', 'MODERATE', 'HIGH'], example: 'MODERATE' })
    riskLevel?: string;

    @ApiPropertyOptional({ example: true })
    status?: boolean;
}

export class CreateOrderSwaggerDto {
    @ApiProperty({ example: '6ac28d3ab1a1181102f3b6be' })
    productId: string;

    @ApiProperty({ enum: ['BUY'], example: 'BUY' })
    type: string;

    @ApiProperty({ example: 10, minimum: 1 })
    quantity: number;
}
