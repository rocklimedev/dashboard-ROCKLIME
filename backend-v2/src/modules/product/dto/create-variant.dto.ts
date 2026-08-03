import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateVariantDto {
  @IsOptional() @IsString() name?: string;

  @IsNotEmpty()
  @IsObject()
  variantOptions: Record<string, any>;

  @IsOptional() meta?: Record<string, any>;
  @IsOptional() quantity?: number = 0;
}
