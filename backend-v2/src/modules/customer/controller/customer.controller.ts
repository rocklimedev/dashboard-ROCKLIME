import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto, @Req() req) {
    return this.customerService.createCustomer(dto, req);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.customerService.getCustomers(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req,
  ) {
    return this.customerService.updateCustomer(id, dto, req);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.customerService.deleteCustomer(id, req);
  }
}
