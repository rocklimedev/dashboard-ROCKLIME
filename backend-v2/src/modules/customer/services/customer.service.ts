import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Customer } from '../models/customer.model';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerType,
} from './dto/customer.dto';
import { ActivityLogService } from '../activity-log/activity-log.service'; // Adjust path
import { NotificationService } from '../notification/notification.service'; // Adjust path

const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer) private customerModel: typeof Customer,
    private activityLogService: ActivityLogService,
    private notificationService: NotificationService,
  ) {}

  private validateCustomerType(type?: string) {
    if (type && !Object.values(CustomerType).includes(type as CustomerType)) {
      throw new BadRequestException(
        `Invalid customerType. Must be one of: ${Object.values(CustomerType).join(', ')}`,
      );
    }
  }

  async createCustomer(dto: CreateCustomerDto, req: any) {
    this.validateCustomerType(dto.customerType);

    const customer = await this.customerModel.create({
      ...dto,
      phone2: dto.phone2 || null,
      customerType: dto.customerType || null,
      gstNumber: dto.gstNumber || null,
    });

    // Activity Log
    this.activityLogService
      .log({
        userId: req?.user?.userId || null,
        contextTag: 'CRM',
        subContext: 'CUSTOMER',
        action: 'CUSTOMER_CREATED',
        entityId: customer.customerId,
        entityName: customer.name,
        description: `Customer "${customer.name}" was created`,
        newValues: customer.get({ plain: true }),
        metadata: { createdBy: req?.user?.userId },
        req,
      })
      .catch(console.error);

    // Notification
    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'New Customer Created',
      message: `A new customer "${customer.name}" has been created.`,
    });

    return customer;
  }

  async getCustomers(query: any) {
    const { page = 1, limit = 20, search } = query;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { mobileNumber: { [Op.like]: searchTerm } },
      ];
    }

    const { count, rows } = await this.customerModel.findAndCountAll({
      where,
      offset,
      limit: +limit,
      order: [['name', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getCustomerById(id: string) {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto, req: any) {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');

    this.validateCustomerType(dto.customerType);

    const oldValues = customer.get({ plain: true });

    await customer.update({
      ...dto,
      phone2: dto.phone2 !== undefined ? dto.phone2 : customer.phone2,
      customerType:
        dto.customerType !== undefined
          ? dto.customerType
          : customer.customerType,
      gstNumber:
        dto.gstNumber !== undefined ? dto.gstNumber : customer.gstNumber,
    });

    const newValues = customer.get({ plain: true });

    // Activity Log
    this.activityLogService
      .log({
        userId: req?.user?.userId,
        contextTag: 'CRM',
        subContext: 'CUSTOMER',
        action: 'CUSTOMER_UPDATED',
        entityId: customer.customerId,
        entityName: customer.name,
        description: `Customer "${customer.name}" was updated`,
        oldValues,
        newValues,
        metadata: { updatedBy: req?.user?.userId },
        req,
      })
      .catch(console.error);

    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Customer Updated',
      message: `Customer "${customer.name}" has been updated.`,
    });

    return customer;
  }

  async deleteCustomer(id: string, req: any) {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');

    await this.notificationService.sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Customer Deleted',
      message: `Customer "${customer.name}" has been deleted.`,
    });

    const oldValues = customer.get({ plain: true });

    await customer.destroy();

    this.activityLogService
      .log({
        userId: req?.user?.userId,
        contextTag: 'CRM',
        subContext: 'CUSTOMER',
        action: 'CUSTOMER_DELETED',
        entityId: customer.customerId,
        entityName: customer.name,
        description: `Customer "${customer.name}" was deleted`,
        oldValues,
        metadata: { deletedBy: req?.user?.userId },
        req,
      })
      .catch(console.error);

    return { message: 'Customer deleted successfully' };
  }
}
