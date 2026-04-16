// src/purchase-orders/purchase-orders.controller.ts
import { Controller, Post, Get, Put, Delete, Param, Body, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.poService.create(dto, req.user?.userId);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.poService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.poService.update(id, dto); // implement update similarly
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.poService.confirmPurchaseOrder(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.poService.remove(id);
  }
}