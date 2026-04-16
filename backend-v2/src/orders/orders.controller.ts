// src/orders/orders.controller.ts
import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(dto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllOrders(@Query() query: any) {
    return this.ordersService.getAllOrders(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOrderDetails(@Param('id') id: string) {
    return this.ordersService.getOrderDetails(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateOrder(@Param('id') id: string, @Body() updates: any, @Req() req: any) {
    return this.ordersService.updateOrderById(id, updates, req.user.userId);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Post('upload-invoice/:orderId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('invoice'))
  uploadInvoice(@Param('orderId') orderId: string, @UploadedFile() file: Express.Multer.File) {
    return this.ordersService.uploadInvoiceAndLinkOrder(orderId, file);
  }

  @Post('issue-gatepass/:orderId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('gatepass'))
  issueGatePass(@Param('orderId') orderId: string, @UploadedFile() file: Express.Multer.File) {
    return this.ordersService.issueGatePass(orderId, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }
}