// src/keywords/dto/update-keyword.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateKeywordDto } from './create-keyword.dto';

export class UpdateKeywordDto extends PartialType(CreateKeywordDto) {}