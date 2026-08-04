import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const RESOURCE_TYPES = ['Order', 'Product', 'Customer'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export class CreateCommentDto {
  @IsString()
  resourceId: string;

  @IsIn(RESOURCE_TYPES)
  resourceType: ResourceType;

  @IsString()
  userId: string;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
