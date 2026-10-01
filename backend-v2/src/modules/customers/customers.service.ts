import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Customer } from './entities/customer.entity';
import { Address } from '../address/entities/address.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { Order } from '../orders/entities/order.entity';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';
import { CreateCustomerDto, CUSTOMER_TYPES, GENDERS, UpdateCustomerDto } from './dto/customer.dto';

/** Port of getTitle()/withTitle() from customer.controller.js */
function getTitle(gender?: string): string {
  switch (gender) {
    case 'Male':
      return 'Mr.';
    case 'Female':
      return 'Ms.';
    case 'Other':
      return 'Mx.';
    default:
      return '';
  }
}
function withTitle(customerJson: any) {
  const title = getTitle(customerJson.gender);
  return {
    ...customerJson,
    title,
    displayName: title ? `${title} ${customerJson.name}` : customerJson.name,
  };
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(Quotation) private readonly quotationModel: typeof Quotation,
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateCustomerDto, userId?: string) {
    if (!dto.name) throw new BadRequestException('name is required');
    if (dto.customerType && !CUSTOMER_TYPES.includes(dto.customerType)) {
      throw new BadRequestException(
        `Invalid customerType. Must be one of: ${CUSTOMER_TYPES.join(', ')}`,
      );
    }
    if (dto.gender && !GENDERS.includes(dto.gender)) {
      throw new BadRequestException(`Invalid gender. Must be one of: ${GENDERS.join(', ')}`);
    }

    const newCustomer = await this.customerModel.create({
      ...dto,
      phone2: dto.phone2 || null,
      customerType: dto.customerType || null,
      gstNumber: dto.gstNumber || null,
      gender: dto.gender || null,
    } as any);

    this.activityLog
      .logActivity({
        userId: userId ?? null,
        contextTag: CONTEXT_TAGS.CRM,
        subContext: SUB_CONTEXTS.CUSTOMER,
        action: 'CUSTOMER_CREATED',
        entityId: newCustomer.customerId,
        entityName: newCustomer.name,
        description: `Customer "${newCustomer.name}" was created`,
        newValues: {
          customerId: newCustomer.customerId,
          name: newCustomer.name,
          email: newCustomer.email,
          mobileNumber: newCustomer.mobileNumber,
          phone2: newCustomer.phone2,
          customerType: newCustomer.customerType,
          gstNumber: newCustomer.gstNumber,
          gender: newCustomer.gender,
        },
        metadata: { createdBy: userId ?? null },
      })
      .catch(() => {});

    // NOTE: legacy also called sendNotification() to an admin user here -
    // wire up once NotificationsModule/engagement is migrated.

    return { success: true, data: withTitle(newCustomer.toJSON()) };
  }

  async findAll(query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    const search = query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { mobileNumber: { [Op.like]: searchTerm } },
        { companyName: { [Op.like]: searchTerm } },
      ];
    }

    const { count: totalCustomers, rows: customers } = await this.customerModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: Address,
          as: 'addresses',
          required: false,
          attributes: ['addressId', 'street', 'city', 'state', 'postalCode', 'country', 'status'],
        },
      ],
    });

    const customerIds = customers.map((c) => c.customerId);

    const quotationStats = customerIds.length
      ? await this.quotationModel.findAll({
          where: { customerId: { [Op.in]: customerIds } } as any,
          attributes: [
            'customerId',
            [this.sequelize.fn('COUNT', this.sequelize.col('quotationId')), 'quotations'],
            [
              this.sequelize.fn(
                'COALESCE',
                this.sequelize.fn('SUM', this.sequelize.col('finalAmount')),
                0,
              ),
              'quotationValue',
            ],
          ],
          group: ['customerId'],
          raw: true,
        })
      : [];

    const orderStats = customerIds.length
      ? await this.orderModel.findAll({
          where: { createdFor: { [Op.in]: customerIds } } as any,
          attributes: [
            'createdFor',
            [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'orders'],
            [
              this.sequelize.fn(
                'COALESCE',
                this.sequelize.fn('SUM', this.sequelize.col('finalAmount')),
                0,
              ),
              'orderValue',
            ],
          ],
          group: ['createdFor'],
          raw: true,
        })
      : [];

    const quotationMap = new Map<string, any>();
    quotationStats.forEach((item: any) =>
      quotationMap.set(item.customerId, {
        quotations: Number(item.quotations || 0),
        quotationValue: Number(item.quotationValue || 0),
      }),
    );
    const orderMap = new Map<string, any>();
    orderStats.forEach((item: any) =>
      orderMap.set(item.createdFor, {
        orders: Number(item.orders || 0),
        orderValue: Number(item.orderValue || 0),
      }),
    );

    const data = customers.map((customer) => {
      const customerJson = customer.toJSON();
      const q = quotationMap.get(customer.customerId) || {};
      const o = orderMap.get(customer.customerId) || {};
      const quotations = q.quotations || 0;
      const orders = o.orders || 0;
      return withTitle({
        ...customerJson,
        quotations,
        quotationValue: q.quotationValue || 0,
        orders,
        orderValue: o.orderValue || 0,
        customerStatus: quotations === 0 && orders === 0 ? 'INACTIVE' : 'ACTIVE',
      });
    });

    return {
      success: true,
      data,
      pagination: {
        total: totalCustomers,
        page,
        limit,
        totalPages: Math.ceil(totalCustomers / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return { success: true, data: withTitle(customer.toJSON()) };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.customerType && !CUSTOMER_TYPES.includes(dto.customerType)) {
      throw new BadRequestException(
        `Invalid customerType. Must be one of: ${CUSTOMER_TYPES.join(', ')}`,
      );
    }
    if (dto.gender && !GENDERS.includes(dto.gender)) {
      throw new BadRequestException(`Invalid gender. Must be one of: ${GENDERS.join(', ')}`);
    }

    await customer.update(dto as any);
    return { success: true, data: withTitle(customer.toJSON()) };
  }

  async remove(id: string) {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');
    await customer.destroy();
    return { success: true, message: 'Customer deleted successfully' };
  }
}
