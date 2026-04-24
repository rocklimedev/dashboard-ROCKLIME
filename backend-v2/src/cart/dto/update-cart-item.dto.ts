import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  // ❌ REMOVE userId → get from JWT

  @IsUUID()
  productId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tax?: number;
}