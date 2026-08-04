import { IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  id: string;

  @IsString()
  status: string;
}
