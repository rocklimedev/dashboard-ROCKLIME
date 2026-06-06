// src/modules/brands/controllers/brand.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { BrandService } from '../services/brand.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  create(@Body() dto: CreateBrandDto, @Req() req: any) {
    return this.brandService.createBrand(dto, req.user);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Get(':brandId/total-products')
  getTotalProducts(@Param('brandId') brandId: string) {
    return this.brandService.getTotalProductsOfBrand(brandId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @Req() req: any,
  ) {
    return this.brandService.updateBrand(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.brandService.deleteBrand(id, req.user);
  }
}
