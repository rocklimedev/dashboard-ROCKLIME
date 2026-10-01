import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { AddCommentDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('count')
  count() {
    return this.ordersService.count();
  }

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    return this.ordersService.recent(limit ? Number(limit) : undefined);
  }

  @Get('filtered')
  getFiltered() {
    return this.ordersService.getFilteredOrders();
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id')
  update() {
    return this.ordersService.updateOrderById();
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.remove(id, user);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  @Put(':id/team')
  updateTeam() {
    return this.ordersService.updateOrderTeam();
  }

  @Post(':id/invoice')
  uploadInvoice() {
    return this.ordersService.uploadInvoiceAndLinkOrder();
  }

  @Post(':id/gate-pass')
  issueGatePass() {
    return this.ordersService.issueGatePass();
  }

  @Get(':id/invoice/download')
  downloadInvoice() {
    return this.ordersService.downloadInvoice();
  }

  @Get(':id/download')
  downloadOrder() {
    return this.ordersService.downloadOrder();
  }

  @Get(':id/document')
  getDocument() {
    return this.ordersService.getDownloadDocument();
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.ordersService.getComments(id);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: AddCommentDto, @CurrentUser() user: any) {
    return this.ordersService.addComment(id, dto, user);
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.ordersService.deleteComment(commentId, user);
  }
}
