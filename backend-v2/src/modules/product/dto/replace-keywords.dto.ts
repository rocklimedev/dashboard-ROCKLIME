import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReplaceKeywordsDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  keywordIds?: string[];
}
