import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from '../role/entities/role.entity'; // Adjust path
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionDto,
} from './dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
    @InjectModel(Role) private roleModel: typeof Role,
  ) {}

  async create(createDto: CreatePermissionDto) {
    const existing = await this.permissionModel.findOne({
      where: {
        api: createDto.api,
        route: createDto.route,
        module: createDto.module,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Permission already exists for this module and route.',
      );
    }

    return this.permissionModel.create(createDto);
  }

  async findAll() {
    return this.permissionModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async findOne(id: number) {
    const permission = await this.permissionModel.findByPk(id);
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(id: number, updateDto: UpdatePermissionDto) {
    const permission = await this.findOne(id);
    await permission.update(updateDto);
    return permission;
  }

  async remove(id: number) {
    const permission = await this.findOne(id);
    await permission.destroy();
    return { message: 'Permission deleted successfully' };
  }

  // === Role Permission Assignment ===
  async assignToRole(assignDto: AssignPermissionDto) {
    const { roleId, permissionId, isGranted = true } = assignDto;

    const role = await this.roleModel.findByPk(roleId);
    const permission = await this.permissionModel.findByPk(permissionId);

    if (!role) throw new NotFoundException('Role not found');
    if (!permission) throw new NotFoundException('Permission not found');

    let rolePermission = await this.rolePermissionModel.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      rolePermission = await this.rolePermissionModel.create({
        roleId,
        permissionId,
        isGranted,
      });
    } else {
      await rolePermission.update({ isGranted });
    }

    return {
      message: `Permission ${isGranted ? 'granted' : 'revoked'} successfully`,
      rolePermission: { roleId, permissionId, isGranted },
    };
  }

  async removeFromRole(roleId: number, permissionId: number) {
    const rolePermission = await this.rolePermissionModel.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission not assigned to this role');
    }

    await rolePermission.destroy();

    return {
      message: 'Permission removed successfully',
      rolePermission: { roleId, permissionId },
    };
  }
}
