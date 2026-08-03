import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FloorRoomInputDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsArray()
  areas?: unknown[];

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class FloorInputDto {
  @IsString()
  floorId: string;

  @IsOptional()
  @IsString()
  floorName?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorRoomInputDto)
  rooms?: FloorRoomInputDto[];
}
