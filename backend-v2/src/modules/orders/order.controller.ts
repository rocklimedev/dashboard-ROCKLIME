import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { OrderDocumentService } from './order-document.service';
import { CreateOrderDto } from './dto/create-product.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrdersDto, GetAllOrdersDto } from './dto/filter-orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly documents: OrderDocumentService,
  ) {}

  // ── CRUD ──
  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    return this.ordersService.createOrder(dto, req);
  }

  @Put(':id')
  updateOrderById(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req: Request,
  ) {
    return this.ordersService.updateOrderById(id, dto, req);
  }

  @Patch('status')
  updateOrderStatus(@Body() dto: UpdateOrderStatusDto, @Req() req: Request) {
    return this.ordersService.updateOrderStatus(dto.id, dto.status, req);
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string, @Req() req: Request) {
    return this.ordersService.deleteOrder(id, req);
  }

  @Post('draft')
  draftOrder(@Body() body: any) {
    return this.ordersService.draftOrder(body);
  }

  // ── READS ──
  @Get()
  getAllOrders(@Query() query: GetAllOrdersDto) {
    return this.ordersService.getAllOrders(query);
  }

  @Get('filter')
  getFilteredOrders(@Query() query: FilterOrdersDto) {
    return this.ordersService.getFilteredOrders(query);
  }

  @Get('recent')
  recentOrders() {
    return this.ordersService.recentOrders();
  }

  @Get('count')
  countOrders(@Query('date') date: string) {
    return this.ordersService.countOrders(date);
  }

  @Get(':id/details')
  getOrderDetails(@Param('id') id: string) {
    return this.ordersService.getOrderDetails(id);
  }

  @Get(':id')
  orderById(@Param('id') id: string) {
    return this.ordersService.orderById(id);
  }

  // ── TEAM ──
  @Patch('team')
  updateOrderTeam(@Body() body: { id: string; assignedTeamId?: string }) {
    return this.ordersService.updateOrderTeam(
      body.id,
      body.assignedTeamId ?? null,
    );
  }

  // ── DOCUMENTS ──
  @Get(':id/download-invoice')
  downloadInvoice(@Param('id') id: string, @Res() res: Response) {
    return this.documents.downloadInvoice(id, res);
  }

  @Get(':id/download')
  downloadOrderPdf(@Param('id') id: string, @Res() res: Response) {
    return this.documents.downloadOrderPdf(id, res);
  }

  @Post(':orderId/invoice')
  @UseInterceptors(FileInterceptor('file'))
  uploadInvoice(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.documents.uploadInvoiceAndLink(orderId, file, req);
  }

  @Post(':orderId/gate-pass')
  @UseInterceptors(FileInterceptor('file'))
  issueGatePass(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.documents.issueGatePass(orderId, file, req);
  }

  @Get(':orderId/document')
  getDownloadDocument(
    @Param('orderId') orderId: string,
    @Query('type') type: 'invoice' | 'gatepass',
    @Res() res: Response,
  ) {
    return this.documents.getDownloadDocument(orderId, type, res);
  }
}
