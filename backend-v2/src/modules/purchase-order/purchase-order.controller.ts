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
import { PurchaseOrderService } from './purchase-order.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/purchase-order.dto';

@Controller('purchase-order')
@UseGuards(JwtAuthGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser('userId') userId: string) {
    return this.purchaseOrderService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.purchaseOrderService.findAll(query);
  }

  @Get('vendor/:vendorId')
  findByVendor(@Param('vendorId') vendorId: string) {
    return this.purchaseOrderService.findByVendor(vendorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.purchaseOrderService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.purchaseOrderService.remove(id, userId);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.purchaseOrderService.confirm(id, userId);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.purchaseOrderService.updateStatus(id, dto, userId);
  }
}
