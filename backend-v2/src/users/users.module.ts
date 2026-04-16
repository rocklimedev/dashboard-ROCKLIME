// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { Address } from 'src/address/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Address]),
    MulterModule.register({ dest: './temp-uploads' }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}