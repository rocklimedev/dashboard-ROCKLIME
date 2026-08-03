import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImportProductRowDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() product_code?: string;
  @IsOptional() @IsString() categoryName?: string;
  @IsOptional() @IsString() brandName?: string;
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() quantity?: number | string;
  @IsOptional() alert_quantity?: number | string;
  @IsOptional() tax?: number | string;
  @IsOptional() isFeatured?: boolean;
  @IsOptional() images?: string[];
  @IsOptional() meta?: Record<string, any>;
  @IsOptional() keywords?: string[];
  @IsOptional() rowIndex?: number;
}

export class BulkImportProductsDto {
  // NOTE: the original bulkImportProducts handler called
  // processProductBatch(products, t) with NO options — but processProductBatch
  // throws if selectedBrandId is missing, so the original endpoint was
  // effectively broken. Making it an explicit required field here so the
  // NestJS endpoint actually works; adjust if you want per-row brands instead.
  @IsNotEmpty() @IsUUID() selectedBrandId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => ImportProductRowDto)
  products: ImportProductRowDto[];
}
