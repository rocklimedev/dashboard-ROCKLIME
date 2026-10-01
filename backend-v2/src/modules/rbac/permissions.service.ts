import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/role.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission) private readonly permissionModel: typeof Permission,
  ) {}

  create(dto: CreatePermissionDto) {
    return this.permissionModel.create(dto as any);
  }

  findAll() {
    return this.permissionModel.findAll();
  }

  async findOne(permissionId: string) {
    const permission = await this.permissionModel.findByPk(permissionId);
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(permissionId: string, dto: Partial<CreatePermissionDto>) {
    const permission = await this.findOne(permissionId);
    await permission.update(dto as any);
    return permission;
  }

  async remove(permissionId: string) {
    const permission = await this.findOne(permissionId);
    await permission.destroy();
    return { message: 'Permission deleted' };
  }
}
