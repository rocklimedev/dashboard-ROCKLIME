// src/customers/customers.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer, CustomerType } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { NotificationsService } from 'src/notification/notification.service';
const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    private notificationService: NotificationsService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const allowedTypes = Object.values(CustomerType);

    if (dto.customerType && !allowedTypes.includes(dto.customerType)) {
      throw new BadRequestException(
        `Invalid customerType. Must be one of: ${allowedTypes.join(', ')}`,
      );
    }

    const customer = this.customerRepository.create({
      ...dto,
      phone2: dto.phone2 || null,
      customerType: dto.customerType || null,
      gstNumber: dto.gstNumber || null,
    });

    const newCustomer = await this.customerRepository.save(customer);

    // Send notification
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'New Customer Created',
      message: `A new customer "${newCustomer.name}" (${newCustomer.email || 'no email'}) has been created.`,
    });

    return newCustomer;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;

    let where: any = {};

    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where = [
        { name: ILike(searchTerm) },
        { email: ILike(searchTerm) },
        { mobileNumber: ILike(searchTerm) },
      ];
    }

    const [customers, total] = await this.customerRepository.findAndCount({
      where,
      skip: offset,
      take: limit,
      order: { name: 'ASC' },
      select: {
        // Exclude timestamps as in original
        createdAt: false,
        updatedAt: false,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({ customerId });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(customerId: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(customerId);

    const allowedTypes = Object.values(CustomerType);
    if (dto.customerType && !allowedTypes.includes(dto.customerType)) {
      throw new BadRequestException(
        `Invalid customerType. Must be one of: ${allowedTypes.join(', ')}`,
      );
    }

    Object.assign(customer, {
      ...dto,
      phone2: dto.phone2 !== undefined ? dto.phone2 : customer.phone2,
      customerType: dto.customerType !== undefined ? dto.customerType : customer.customerType,
      gstNumber: dto.gstNumber !== undefined ? dto.gstNumber : customer.gstNumber,
    });

    const updatedCustomer = await this.customerRepository.save(customer);

    // Send notification
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Customer Updated',
      message: `Customer "${updatedCustomer.name}" has been updated.`,
    });

    return updatedCustomer;
  }

  async remove(customerId: string): Promise<void> {
    const customer = await this.findOne(customerId);

    // Send notification before delete
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Customer Deleted',
      message: `Customer "${customer.name}" (${customer.email || 'no email'}) has been deleted.`,
    });

    await this.customerRepository.remove(customer);
  }

  // Get invoices for a customer
  async getInvoicesByCustomerId(customerId: string) {
    const customer = await this.customerRepository.findOneBy({ customerId });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Assuming Invoice has relation to Customer
    return customer.invoices || []; // If you loaded relations, or use query builder
  }
}