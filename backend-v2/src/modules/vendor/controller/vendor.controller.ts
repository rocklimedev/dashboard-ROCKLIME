import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  async create(@Body() createVendorDto: CreateVendorDto, @Req() req: any) {
    return this.vendorService.create(createVendorDto, req);
  }

  @Get()
  async findAll() {
    return this.vendorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.vendorService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateVendorDto: UpdateVendorDto,
    @Req() req: any,
  ) {
    return this.vendorService.update(id, updateVendorDto, req);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: number, @Req() req: any) {
    return this.vendorService.remove(id, req);
  }

  @Get('check/:vendorId')
  async checkVendorId(@Param('vendorId') vendorId: string) {
    return this.vendorService.checkVendorId(vendorId);
  }
}
