// src/modules/brands/controllers/brand-parent-category.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { BrandParentCategoryService } from '../services/brand-parent-category.service';
import {
  CreateBrandParentCategoryDto,
  UpdateBrandParentCategoryDto,
  AttachBrandsDto,
} from '../dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('brand-parent-categories')
export class BrandParentCategoryController {
  constructor(private readonly bpcService: BrandParentCategoryService) {}

  @Post()
  create(@Body() dto: CreateBrandParentCategoryDto) {
    return this.bpcService.create(dto);
  }

  @Get()
  list() {
    return this.bpcService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.bpcService.findOne(id);
  }

  @Get(':id/tree')
  getTree(@Param('id') id: string) {
    return this.bpcService.getTree(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandParentCategoryDto) {
    return this.bpcService.update(id, dto);
  }

  @Post(':id/attach-brands')
  attachBrands(@Param('id') id: string, @Body() dto: AttachBrandsDto) {
    return this.bpcService.attachBrands(id, dto);
  }

  @Delete(':id/brands/:brandId')
  detachBrand(@Param('id') id: string, @Param('brandId') brandId: string) {
    return this.bpcService.detachBrand(id, brandId);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.bpcService.remove(id);
  }
}
