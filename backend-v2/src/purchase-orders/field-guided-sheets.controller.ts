// src/field-guided-sheets/field-guided-sheets.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FieldGuidedSheetsService } from './field-guided-sheets.service';
import { CreateFieldGuidedSheetDto } from './dto/create-fgs.dto';
import { UpdateFieldGuidedSheetDto } from './dto/update-fgs.dto';

@Controller('field-guided-sheets')
export class FieldGuidedSheetsController {
  constructor(private readonly fgsService: FieldGuidedSheetsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreateFieldGuidedSheetDto, @Req() req: any) {
    return this.fgsService.create(dto, req.user?.userId);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.fgsService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fgsService.findOne(id);
  }

  @Post(':id/convert')
  convertToPo(@Param('id') id: string, @Req() req: any) {
    return this.fgsService.convertToPo(id, req.user?.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFieldGuidedSheetDto) {
    return this.fgsService.update(id, dto); // implement similarly
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fgsService.remove(id);
  }
}