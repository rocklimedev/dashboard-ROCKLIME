import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(
    @Body() dto: CreateAddressDto,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.addressService.create(dto, actorId, req);
  }

  @Get()
  findAll() {
    return this.addressService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.addressService.findByUser(userId);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.addressService.findByCustomer(customerId);
  }

  @Get(':addressId')
  findOne(@Param('addressId') addressId: string) {
    return this.addressService.findOne(addressId);
  }

  @Put(':addressId')
  update(
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.addressService.update(addressId, dto, actorId, req);
  }

  @Delete(':addressId')
  remove(
    @Param('addressId') addressId: string,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.addressService.remove(addressId, actorId, req);
  }
}
