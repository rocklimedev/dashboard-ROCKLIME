// src/modules/addresses/controllers/address.controller.ts
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
  UseGuards,
} from '@nestjs/common';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Body() dto: CreateAddressDto, @Req() req: any) {
    return this.addressService.createAddress(dto, req.user);
  }

  @Get()
  findAll(@Query() query: { userId?: string; customerId?: string }) {
    return this.addressService.findAll(query);
  }

  @Get(':addressId')
  findOne(@Param('addressId') addressId: string) {
    return this.addressService.findOne(addressId);
  }

  @Put(':addressId')
  update(
    @Param('addressId') addressId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.addressService.updateAddress(addressId, dto, req.user);
  }

  @Delete(':addressId')
  remove(@Param('addressId') addressId: string, @Req() req: any) {
    return this.addressService.deleteAddress(addressId, req.user);
  }
}
