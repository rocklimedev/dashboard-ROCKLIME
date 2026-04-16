// src/addresses/addresses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesController } from './address.controller';
import { AddressesService } from './address.service';
import { Address } from './entities/address.entity';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
// Import your NotificationModule if needed

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, User, Customer]),
    // NotificationModule, // if you want to inject NotificationService
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}