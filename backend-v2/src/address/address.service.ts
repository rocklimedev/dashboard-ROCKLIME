// src/addresses/addresses.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Address, AddressStatus } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { NotificationsService } from '../notification/notification.service'; // adjust path

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    private readonly notificationService: NotificationsService,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const { userId, customerId, status, ...addressData } = createAddressDto;

    // 1. Exactly one owner
    if ((userId && customerId) || (!userId && !customerId)) {
      throw new BadRequestException('Address must belong to exactly one: User or Customer');
    }

    // 2. Validate owner exists
    if (userId) {
      const user = await this.userRepository.findOneBy({ userId });
      if (!user) throw new NotFoundException('User not found');
    }

    if (customerId) {
      const customer = await this.customerRepository.findOneBy({ customerId });
      if (!customer) throw new NotFoundException('Customer not found');
    }

    // 3. Status logic (especially for customers)
    let finalStatus = AddressStatus.ADDITIONAL;

    if (customerId) {
      const existing = await this.addressRepository.find({
        where: { customerId },
        order: { createdAt: 'ASC' },
      });

      if (existing.length === 0) {
        finalStatus = AddressStatus.BILLING;
      } else if (existing.length === 1) {
        finalStatus = AddressStatus.PRIMARY;
      } else if ([AddressStatus.BILLING, AddressStatus.PRIMARY].includes(status as any)) {
        // Demote existing
        await this.addressRepository.update(
          { customerId, status: status as AddressStatus },
          { status: AddressStatus.ADDITIONAL },
        );
        finalStatus = status as AddressStatus;
      }
    } else {
      finalStatus = (status as AddressStatus) || AddressStatus.ADDITIONAL;
    }

    const address = this.addressRepository.create({
      ...addressData,
      status: finalStatus,
      userId: userId || null,
      customerId: customerId || null,
    });

    return this.addressRepository.save(address);
  }

  async update(addressId: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.addressRepository.findOneBy({ addressId });
    if (!address) throw new NotFoundException('Address not found');

    const { userId, customerId, status, ...updateData } = updateAddressDto;

    // Prevent changing ownership type
    if (
      (userId && address.customerId) ||
      (customerId && address.userId) ||
      (userId && customerId)
    ) {
      throw new BadRequestException('Cannot change address ownership from User to Customer or vice versa');
    }

    // Validate new owner if changed
    if (userId && userId !== address.userId) {
      const user = await this.userRepository.findOneBy({ userId });
      if (!user) throw new NotFoundException('User not found');
    }
    if (customerId && customerId !== address.customerId) {
      const customer = await this.customerRepository.findOneBy({ customerId });
      if (!customer) throw new NotFoundException('Customer not found');
    }

    // Status logic for customer addresses
    let finalStatus = (status as AddressStatus) || address.status;

    if (address.customerId && [AddressStatus.BILLING, AddressStatus.PRIMARY].includes(status as any)) {
      await this.addressRepository.update(
        {
          customerId: address.customerId,
          status: status as AddressStatus,
          addressId: Not(addressId),
        },
        { status: AddressStatus.ADDITIONAL },
      );
      finalStatus = status as AddressStatus;
    }

    Object.assign(address, {
      ...updateData,
      status: finalStatus,
      userId: userId ?? address.userId,
      customerId: customerId ?? address.customerId,
    });

    const updated = await this.addressRepository.save(address);

    // Notification
    const recipientId = userId || customerId || address.userId || address.customerId;
    if (recipientId) {
      await this.notificationService.sendNotification({
        userId: recipientId, // adjust if your notification expects different shape
        title: 'Address Updated',
        message: `Your ${finalStatus} address was updated.`,
      });
    }

    return updated;
  }

  async remove(addressId: string): Promise<void> {
    const address = await this.addressRepository.findOneBy({ addressId });
    if (!address) throw new NotFoundException('Address not found');

    const isCustomerAddress = !!address.customerId;
    const ownerId = address.userId || address.customerId;

    // Reassign BILLING / PRIMARY if deleting special status
    if (isCustomerAddress && [AddressStatus.BILLING, AddressStatus.PRIMARY].includes(address.status)) {
      const others = await this.addressRepository.find({
        where: {
          customerId: address.customerId,
          addressId: Not(addressId),
        },
        order: { createdAt: 'ASC' },
      });

      if (others.length > 0) {
        if (address.status === AddressStatus.BILLING) {
          await this.addressRepository.update(others[0].addressId, { status: AddressStatus.BILLING });
        }
        if (address.status === AddressStatus.PRIMARY && others.length > 1) {
          await this.addressRepository.update(others[1].addressId, { status: AddressStatus.PRIMARY });
        }
      }
    }

    // Notification
    if (ownerId) {
      await this.notificationService.sendNotification({
        userId: ownerId,
        title: 'Address Deleted',
        message: `Your ${address.status} address was removed.`,
      });
    }

    await this.addressRepository.remove(address);
  }

  async findAll(userId?: string, customerId?: string): Promise<Address[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;

    return this.addressRepository.find({
      where,
      relations: ['user', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(addressId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { addressId },
      relations: ['user', 'customer'],
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  // Optional: Get all users with their addresses
  async getAllUserAddresses() {
    return this.userRepository.find({
      relations: ['addresses'],
      order: { addresses: { createdAt: 'DESC' } },
    });
  }

  // Optional: Get all customers with their addresses
  async getAllCustomerAddresses() {
    return this.customerRepository.find({
      relations: ['addresses'],
      order: { addresses: { createdAt: 'DESC' } },
    });
  }
}