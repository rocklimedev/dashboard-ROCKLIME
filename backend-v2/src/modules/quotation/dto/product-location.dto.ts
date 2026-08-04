import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProductLocationDto {
  @IsString()
  floorId: string;

  @IsOptional()
  @IsString()
  floorName?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsOptional()
  @IsString()
  areaName?: string;

  @IsNumber()
  @Min(0)
  assignedQuantity: number;
}
