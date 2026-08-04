import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FilterOrdersDto {
  @IsOptional()
  @IsIn([
    'PREPARING',
    'CHECKING',
    'INVOICE',
    'DISPATCHED',
    'DELIVERED',
    'PARTIALLY_DELIVERED',
    'CANCELED',
    'DRAFT',
    'ONHOLD',
  ])
  status?: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  assignedTeamId?: string;

  @IsOptional()
  @IsString()
  createdFor?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  masterPipelineNo?: string;

  @IsOptional()
  @IsString()
  previousOrderNo?: string;

  @IsOptional()
  @IsString()
  shipTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}

export class GetAllOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string = '';

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}
