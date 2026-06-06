import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RolePermission } from '../models/role-permission.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { AssignPermissionToRoleDto } from './dto/role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
  ) {}

  async assignPermissionToRole(dto: AssignPermissionToRoleDto, req?: any) {
    const { roleId, permissionId } = dto;

    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const permission = await this.permissionModel.findByPk(permissionId);
    if (!permission) throw new NotFoundException('Permission not found');

    const existing = await this.rolePermissionModel.findOne({
      where: { roleId, permissionId },
    });

    if (existing) {
      return {
        message: 'Permission already assigned to role',
        rolePermission: existing,
      };
    }

    const rolePermission = await this.rolePermissionModel.create({
      roleId,
      permissionId,
    });

    return {
      message: 'Permission assigned to role successfully',
      rolePermission,
    };
  }

  async removePermissionFromRole(dto: AssignPermissionToRoleDto) {
    const { roleId, permissionId } = dto;

    const rolePermission = await this.rolePermissionModel.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission is not assigned to this role');
    }

    await rolePermission.destroy();

    return {
      message: 'Permission removed from role successfully',
      rolePermission: { roleId, permissionId },
    };
  }

  async getAllRolePermissionsByRoleId(roleId: string) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const rolePermissions = await this.rolePermissionModel.findAll({
      where: { roleId },
      include: [
        { model: Role, as: 'role', attributes: ['roleId', 'roleName'] },
        {
          model: Permission,
          as: 'permission',
          attributes: ['permissionId', 'module', 'name', 'route', 'api'],
        },
      ],
    });

    return {
      message: rolePermissions.length
        ? 'Role permissions retrieved successfully'
        : 'No permissions found for this role',
      roleId,
      rolePermissions,
    };
  }

  async getRolePermissionByRoleAndPermission(
    roleId: string,
    permissionId: string,
  ) {
    const rolePermission = await this.rolePermissionModel.findOne({
      where: { roleId, permissionId },
      include: [
        { model: Role, as: 'role', attributes: ['roleId', 'roleName'] },
        {
          model: Permission,
          as: 'permission',
          attributes: ['permissionId', 'module', 'name', 'route', 'api'],
        },
      ],
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission not assigned to role');
    }

    return {
      message: 'Role permission retrieved successfully',
      rolePermission,
    };
  }

  async getAllRolePermissions() {
    const rolePermissions = await this.rolePermissionModel.findAll({
      include: [
        { model: Role, as: 'role', attributes: ['roleId', 'roleName'] },
        {
          model: Permission,
          as: 'permission',
          attributes: ['permissionId', 'module', 'name', 'route', 'api'],
        },
      ],
    });

    return {
      message: 'All role permissions retrieved successfully',
      rolePermissions,
    };
  }
}
