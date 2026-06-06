import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CachedPermission } from './entities/cached-permission.entity';
import { CachedPermissionService } from './cached-permission.service';
import { CachedPermissionController } from './cached-permission.controller';

@Module({
  imports: [SequelizeModule.forFeature([CachedPermission])],
  controllers: [CachedPermissionController],
  providers: [CachedPermissionService],
  exports: [CachedPermissionService],
})
export class CachedPermissionModule {}
