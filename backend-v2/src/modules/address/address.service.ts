import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Address } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';

interface RequestContext {
  ip?: string;
  headers?: Record<string, any>;
}

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address) private readonly addressModel: typeof Address,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateAddressDto, actorId?: string, req?: RequestContext) {
    const address = await this.addressModel.create(dto as any);

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.CRM,
        subContext: SUB_CONTEXTS.ADDRESS,
        action: 'ADDRESS_CREATED',
        entityId: address.addressId,
        entityName: `${address.street}, ${address.city}`,
        description: `Address created for ${dto.userId ? 'User' : 'Customer'}`,
        newValues: {
          addressId: address.addressId,
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          status: address.status,
          userId: address.userId || null,
          customerId: address.customerId || null,
        },
        req,
      })
      .catch(() => {});

    return address;
  }

  findAll() {
    return this.addressModel.findAll();
  }

  async findOne(addressId: string) {
    const address = await this.addressModel.findByPk(addressId);
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  findByUser(userId: string) {
    return this.addressModel.findAll({ where: { userId } });
  }

  findByCustomer(customerId: string) {
    return this.addressModel.findAll({ where: { customerId } });
  }

  async update(
    addressId: string,
    dto: UpdateAddressDto,
    actorId?: string,
    req?: RequestContext,
  ) {
    const address = await this.findOne(addressId);

    const oldValues = {
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      status: address.status,
    };

    await address.update(dto as any);

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.CRM,
        subContext: SUB_CONTEXTS.ADDRESS,
        action: 'ADDRESS_UPDATED',
        entityId: address.addressId,
        entityName: `${address.street}, ${address.city}`,
        description: `Address updated for ${address.userId ? 'User' : 'Customer'}`,
        oldValues,
        newValues: {
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          status: address.status,
        },
        req,
      })
      .catch(() => {});

    return address;
  }

  async remove(addressId: string, actorId?: string, req?: RequestContext) {
    const address = await this.findOne(addressId);

    const snapshot = {
      addressId: address.addressId,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      status: address.status,
      userId: address.userId,
      customerId: address.customerId,
    };

    await address.destroy();

    // NOTE: legacy also called sendNotification() to the address owner
    // here - TODO once NotificationsModule is migrated.

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.CRM,
        subContext: SUB_CONTEXTS.ADDRESS,
        action: 'ADDRESS_DELETED',
        entityId: snapshot.addressId,
        entityName: `${snapshot.street}, ${snapshot.city}`,
        description: `Address deleted for ${snapshot.userId ? 'User' : 'Customer'}`,
        oldValues: snapshot,
        req,
      })
      .catch(() => {});

    return { message: 'Address deleted' };
  }
}
