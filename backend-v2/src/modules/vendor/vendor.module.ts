import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Vendor } from './entities/vendor.entity';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { LogActivityService } from '../common/services/log-activity.service'; // Adjust path

@Module({
  imports: [SequelizeModule.forFeature([Vendor])],
  controllers: [VendorController],
  providers: [VendorService, LogActivityService],
  exports: [VendorService],
})
export class VendorModule {}
