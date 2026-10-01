import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreateProductMetaInput,
  ProductMetaService,
} from './product-meta.service';

@Controller('product-meta')
@UseGuards(JwtAuthGuard)
export class ProductMetaController {
  constructor(private readonly productMetaService: ProductMetaService) {}

  @Post()
  create(@Body() dto: CreateProductMetaInput) {
    return this.productMetaService.create(dto);
  }

  @Get()
  findAll() {
    return this.productMetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productMetaService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductMetaInput>) {
    return this.productMetaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productMetaService.remove(id);
  }
}
