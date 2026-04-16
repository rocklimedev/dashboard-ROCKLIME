// src/addresses/addresses.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AddressesService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(createAddressDto);
  }

  @Put(':addressId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Param('addressId') addressId: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(addressId, updateAddressDto);
  }

  @Delete(':addressId')
  remove(@Param('addressId') addressId: string) {
    return this.addressesService.remove(addressId);
  }

  @Get()
  findAll(@Query('userId') userId?: string, @Query('customerId') customerId?: string) {
    return this.addressesService.findAll(userId, customerId);
  }

  @Get(':addressId')
  findOne(@Param('addressId') addressId: string) {
    return this.addressesService.findOne(addressId);
  }

  @Get('users/all')
  getAllUserAddresses() {
    return this.addressesService.getAllUserAddresses();
  }

  @Get('customers/all')
  getAllCustomerAddresses() {
    return this.addressesService.getAllCustomerAddresses();
  }
}