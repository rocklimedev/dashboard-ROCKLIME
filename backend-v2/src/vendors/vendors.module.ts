// src/vendors/vendors.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { Vendor } from './entities/vendor.entity';
import { Brand } from '../brands/entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, Brand]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}