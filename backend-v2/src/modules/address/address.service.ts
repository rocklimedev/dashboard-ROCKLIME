// src/modules/addresses/services/address.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Address, AddressStatus } from './models/address.model';
import { User } from '../users/models/user.model';
import { Customer } from '../customer/models/customer.model';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityLoggerService } from '@/common/services/activity-logger.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address) private readonly addressModel: typeof Address,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    private readonly notificationService: NotificationService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async createAddress(dto: CreateAddressDto, reqUser: any) {
    const {
      street,
      city,
      state,
      postalCode,
      country,
      userId,
      customerId,
      status,
    } = dto;

    if (!street || !city || !state || !country) {
      throw new BadRequestException(
        'Street, city, state, and country are required',
      );
    }

    if ((userId && customerId) || (!userId && !customerId)) {
      throw new BadRequestException(
        'Address must belong to exactly one: User or Customer',
      );
    }

    // Validate owner
    if (userId) {
      const user = await this.userModel.findByPk(userId);
      if (!user) throw new NotFoundException('User not found');
    }
    if (customerId) {
      const customer = await this.customerModel.findByPk(customerId);
      if (!customer) throw new NotFoundException('Customer not found');
    }

    let finalStatus = AddressStatus.ADDITIONAL;

    if (customerId) {
      const existing = await this.addressModel.findAll({
        where: { customerId },
        order: [['createdAt', 'ASC']],
      });

      if (existing.length === 0) {
        finalStatus = AddressStatus.BILLING;
      } else if (existing.length === 1) {
        finalStatus = AddressStatus.PRIMARY;
      } else if (
        [AddressStatus.BILLING, AddressStatus.PRIMARY].includes(status as any)
      ) {
        await this.addressModel.update(
          { status: AddressStatus.ADDITIONAL },
          { where: { customerId, status } },
        );
        finalStatus = status;
      }
    } else {
      finalStatus = (status as AddressStatus) || AddressStatus.ADDITIONAL;
    }

    const address = await this.addressModel.create({
      addressId: uuidv4(),
      street,
      city,
      state,
      postalCode,
      country,
      status: finalStatus,
      userId: userId || null,
      customerId: customerId || null,
    });

    // Activity Log
    this.activityLogger
      .log({
        userId: reqUser?.userId,
        contextTag: 'CRM',
        subContext: 'ADDRESS',
        action: 'ADDRESS_CREATED',
        entityId: address.addressId,
        entityName: `${street}, ${city}`,
        description: `Address created for ${userId ? 'User' : 'Customer'}`,
        newValues: { ...address.get({ plain: true }) },
        metadata: {
          ownerType: userId ? 'USER' : 'CUSTOMER',
          ownerId: userId || customerId,
          createdBy: reqUser?.userId,
        },
        req,
      })
      .catch(console.error);

    return address;
  }

  async updateAddress(addressId: string, dto: UpdateAddressDto, reqUser: any) {
    const address = await this.addressModel.findByPk(addressId);
    if (!address) throw new NotFoundException('Address not found');

    const { userId, customerId, status, ...fields } = dto;

    // Prevent ownership type change
    if (
      (userId && address.customerId) ||
      (customerId && address.userId) ||
      (userId && customerId)
    ) {
      throw new BadRequestException('Cannot change address ownership type');
    }

    // Validate new owner
    if (userId && userId !== address.userId) {
      const user = await this.userModel.findByPk(userId);
      if (!user) throw new NotFoundException('User not found');
    }
    if (customerId && customerId !== address.customerId) {
      const customer = await this.customerModel.findByPk(customerId);
      if (!customer) throw new NotFoundException('Customer not found');
    }

    let finalStatus = status || address.status;

    if (
      address.customerId &&
      [AddressStatus.BILLING, AddressStatus.PRIMARY].includes(status as any)
    ) {
      await this.addressModel.update(
        { status: AddressStatus.ADDITIONAL },
        {
          where: {
            customerId: address.customerId,
            status,
            addressId: { [Op.ne]: addressId },
          },
        },
      );
      finalStatus = status;
    }

    await address.update({
      ...fields,
      status: finalStatus,
      userId: userId ?? address.userId,
      customerId: customerId ?? address.customerId,
    });

    // Activity Log + Notification
    this.activityLogger
      .log(/* ... similar as create ... */)
      .catch(console.error);

    const recipientId =
      userId || customerId || address.userId || address.customerId;
    await this.notificationService.send({
      userId: recipientId,
      title: 'Address Updated',
      message: `Your ${finalStatus} address was updated.`,
    });

    return address;
  }

  async deleteAddress(addressId: string, reqUser: any) {
    const address = await this.addressModel.findByPk(addressId);
    if (!address) throw new NotFoundException('Address not found');

    const isCustomerAddress = !!address.customerId;
    const ownerId = address.userId || address.customerId;

    // Reassign BILLING / PRIMARY
    if (
      isCustomerAddress &&
      [AddressStatus.BILLING, AddressStatus.PRIMARY].includes(address.status)
    ) {
      const others = await this.addressModel.findAll({
        where: {
          customerId: address.customerId,
          addressId: { [Op.ne]: addressId },
        },
        order: [['createdAt', 'ASC']],
      });

      if (others.length > 0) {
        if (address.status === AddressStatus.BILLING) {
          await others[0].update({ status: AddressStatus.BILLING });
        }
        if (address.status === AddressStatus.PRIMARY && others.length > 1) {
          await others[1].update({ status: AddressStatus.PRIMARY });
        }
      }
    }

    await this.notificationService.send({
      userId: ownerId,
      title: 'Address Deleted',
      message: `Your ${address.status} address was removed.`,
    });

    await this.activityLogger.log({
      userId: reqUser?.userId,
      action: 'ADDRESS_DELETED',
      entityId: address.addressId,
      // ... other fields
    });

    await address.destroy();
  }

  async findAll(query: { userId?: string; customerId?: string }) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.customerId) where.customerId = query.customerId;

    return this.addressModel.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['userId', 'name', 'email'] },
        {
          model: Customer,
          as: 'customer',
          attributes: ['customerId', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(addressId: string) {
    const address = await this.addressModel.findByPk(addressId, {
      include: [
        { model: User, as: 'user', attributes: ['userId', 'name', 'email'] },
        {
          model: Customer,
          as: 'customer',
          attributes: ['customerId', 'name', 'email'],
        },
      ],
    });

    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  // Optional: get all users with addresses, etc.
}
