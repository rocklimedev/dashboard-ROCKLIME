// src/modules/brands/dto/attach-brands.dto.ts
import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class AttachBrandsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  brandIds: string[] = [];
}
