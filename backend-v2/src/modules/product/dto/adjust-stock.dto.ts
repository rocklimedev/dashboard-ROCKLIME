import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional() @IsString() orderNo?: string;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsString() message?: string;
}
