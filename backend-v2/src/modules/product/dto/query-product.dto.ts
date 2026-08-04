import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 50;
  @IsOptional() @IsString() search?: string;

  @IsOptional()
  @IsIn(['all', 'in-stock', 'out-of-stock', 'low-stock'])
  tab?: string = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number = 10;
}
