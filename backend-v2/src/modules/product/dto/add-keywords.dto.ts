import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AddKeywordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  keywordIds: string[];
}
