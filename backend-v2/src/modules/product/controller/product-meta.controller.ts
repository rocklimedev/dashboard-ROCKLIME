import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductMetaService } from './product-meta.service';
import {
  CreateProductMetaDto,
  UpdateProductMetaDto,
} from './dto/product-meta.dto';

@Controller('product-meta')
export class ProductMetaController {
  constructor(private readonly productMetaService: ProductMetaService) {}

  @Post()
  create(@Body() createDto: CreateProductMetaDto) {
    return this.productMetaService.create(createDto);
  }

  @Get()
  findAll() {
    return this.productMetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productMetaService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductMetaDto,
  ) {
    return this.productMetaService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productMetaService.remove(id);
  }

  @Get('search/title')
  findByTitle(@Query('title') title: string) {
    return this.productMetaService.findByTitle(title);
  }

  @Get('search/slug')
  findBySlug(@Query('slug') slug: string) {
    return this.productMetaService.findBySlug(slug);
  }
}
