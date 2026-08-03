import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProductLocationDto } from './product-location.dto';

export class ProductInputDto {
  @IsOptional()
  @IsString()
  productId?: string;

  // Some callers send `id` instead of `productId` — both are accepted
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  companyCode?: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsIn(['percent', 'flat'])
  discountType?: 'percent' | 'flat';

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isOption?: boolean;

  // Legacy field name for "this is an option of" a parent product
  @IsOptional()
  @IsString()
  isOptionFor?: string;

  @IsOptional()
  @IsString()
  parentProductId?: string;

  @IsOptional()
  @IsString()
  optionType?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductLocationDto)
  locations?: ProductLocationDto[];

  // Legacy single-location fields (backward compatibility)
  @IsOptional()
  @IsString()
  floorId?: string;

  @IsOptional()
  @IsString()
  floorName?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  roomName?: string;
}
