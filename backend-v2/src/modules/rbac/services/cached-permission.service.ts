import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CachedPermission } from './entities/cached-permission.entity';

@Injectable()
export class CachedPermissionService {
  constructor(
    @InjectModel(CachedPermission)
    private cachedPermissionModel: typeof CachedPermission,
  ) {}

  async getAll() {
    return this.cachedPermissionModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async getByRoleId(roleId: number) {
    const cached = await this.cachedPermissionModel.findOne({
      where: { roleId },
    });

    if (!cached) {
      throw new NotFoundException(
        `No cached permission found for roleId: ${roleId}`,
      );
    }

    return cached;
  }
}
