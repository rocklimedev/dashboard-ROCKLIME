import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RESOURCE_TYPES, ResourceType } from './create-comment.dto';

export class FetchCommentsDto {
  @IsString()
  resourceId: string;

  @IsIn(RESOURCE_TYPES)
  resourceType: ResourceType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export class DeleteCommentsByResourceDto {
  @IsString()
  resourceId: string;

  @IsIn(RESOURCE_TYPES)
  resourceType: ResourceType;
}
