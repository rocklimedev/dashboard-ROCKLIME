import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Array, or JSON-stringified array of image URLs to remove.
  @IsOptional()
  imagesToDelete?: string[] | string;
}
