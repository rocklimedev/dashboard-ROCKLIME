import { IsBoolean } from 'class-validator';

export class UpdateFeaturedDto {
  @IsBoolean()
  isFeatured: boolean;
}
