// src/modules/categories/controllers/parent-category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ParentCategoryService } from '../services/parent-category.service';
import { CreateParentCategoryDto } from '../dto/create-parent-category.dto';
import { UpdateParentCategoryDto } from '../dto/update-parent-category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('parent-categories')
export class ParentCategoryController {
  constructor(private readonly parentCategoryService: ParentCategoryService) {}

  @Post()
  create(@Body() dto: CreateParentCategoryDto) {
    return this.parentCategoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.parentCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parentCategoryService.findOne(id);
  }

  @Get(':id/details')
  getWithBrandsAndCounts(@Param('id') id: string) {
    return this.parentCategoryService.getParentCategoryWithBrandsAndCounts(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateParentCategoryDto) {
    return this.parentCategoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.parentCategoryService.remove(id);
  }
}
