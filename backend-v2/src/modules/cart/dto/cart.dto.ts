import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddProductToCartDto {
  @IsUUID()
  userId: string;

  @IsString()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CartItemInput {
  @IsString()
  productId: string;

  quantity: number;

  @IsOptional()
  discount?: number;

  @IsOptional()
  tax?: number;
}

export class AddToCartDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  items: CartItemInput[];
}

export class RemoveFromCartDto {
  @IsUUID()
  userId: string;

  @IsString()
  productId: string;
}

export class UpdateCartDto {
  @IsUUID()
  userId: string;

  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  discount?: number;

  @IsOptional()
  tax?: number;
}

export class ClearCartDto {
  @IsUUID()
  userId: string;
}

export class ConvertQuotationToCartDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  quotationId: string;
}
