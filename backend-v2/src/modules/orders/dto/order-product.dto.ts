import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OrderProductDto {
  @IsString()
  id: string; // productId (accepts `id` or `productId` from clients)

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  companyCode?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  discount?: number = 0;

  @IsOptional()
  @IsIn(['fixed', 'percent'])
  discountType?: 'fixed' | 'percent' = 'percent';

  @IsOptional()
  @IsNumber()
  tax?: number = 0;

  @IsOptional()
  @IsNumber()
  total?: number;
}
