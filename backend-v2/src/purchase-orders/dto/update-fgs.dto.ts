// src/field-guided-sheets/dto/update-fgs.dto.ts
import { PartialType, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FGSStatus } from '../entities/field-guided-sheet.entity';
import { CreateFieldGuidedSheetDto } from './create-fgs.dto';

class UpdateFgsItemDto extends PartialType(CreateFieldGuidedSheetDto['items'][0]) {}

export class UpdateFieldGuidedSheetDto {
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsEnum(FGSStatus)
  @IsOptional()
  status?: FGSStatus;

  @IsOptional()
  @IsDateString()
  expectDeliveryDate?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateFgsItemDto)
  items?: UpdateFgsItemDto[];
}