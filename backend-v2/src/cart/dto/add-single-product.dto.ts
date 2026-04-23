import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddSingleProductDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}