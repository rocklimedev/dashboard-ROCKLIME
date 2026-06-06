import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { Permission } from '../models/permission.model';
import { RolePermission } from '../models/role-permission.model';
import { ActivityLogService } from '../activity-log/activity-log.service';
import {
  CreateRoleDto,
  AssignRoleToUserDto,
  AssignPermissionsToRoleDto,
  UpdateRolePermissionsDto,
} from './dto/role.dto';
import { ROLES } from '../config/constant';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
    private activityLogService: ActivityLogService,
  ) {}

  // ==================== USER ROLE ASSIGNMENT ====================

  async assignRoleToUser(dto: AssignRoleToUserDto, req: any) {
    const { userId, role } = dto;

    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const roleData = await this.roleModel.findOne({
      where: { roleName: role },
    });
    if (!roleData) throw new BadRequestException('Invalid role specified');

    // SuperAdmin uniqueness check
    if (role === 'SuperAdmin') {
      const existingSuperAdmin = await this.userModel.findOne({
        where: { roles: { [Op.substring]: 'SuperAdmin' } },
      });
      if (existingSuperAdmin) {
        throw new ConflictException('A SuperAdmin already exists');
      }
    }

    const oldValues = {
      roles: user.roles,
      roleId: user.roleId,
      status: user.status,
    };

    let userRoles = user.roles ? user.roles.split(',') : [];

    if (role === 'Users') {
      user.roles = 'Users';
      user.roleId = null;
      user.status = 'inactive';
    } else {
      if (!userRoles.includes(role)) userRoles.push(role);
      user.roles = userRoles.join(',');
      user.roleId = roleData.roleId;
      user.status = 'active';
    }

    await user.save();

    await this.activityLogService.log({
      userId: req?.user?.userId,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'ASSIGN_ROLE',
      entityId: user.id,
      entityName: user.username || user.email,
      description: `Role ${role} assigned to user`,
      oldValues,
      newValues: {
        roles: user.roles,
        roleId: user.roleId,
        status: user.status,
      },
      metadata: {
        assignedRole: role,
        isSuperAdminAttempt: role === 'SuperAdmin',
      },
      req,
    });

    return { success: true, message: `Role ${role} assigned successfully` };
  }

  async getRecentRoleToGive() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const users = await this.userModel.findAll({
      where: {
        [Op.or]: [
          { roleId: { [Op.is]: null } },
          { createdAt: { [Op.gte]: fourteenDaysAgo }, status: 'inactive' },
        ],
        status: { [Op.ne]: 'restricted' },
      },
      include: [{ model: Role, attributes: ['roleId', 'roleName'] }],
    });

    return {
      success: true,
      message: users.length
        ? 'Users fetched'
        : 'No users left for role assignment',
      users,
    };
  }

  async checkUserRoleStatus() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await this.userModel.update(
      { status: 'inactive' },
      {
        where: {
          roleId: null,
          createdAt: { [Op.lte]: sevenDaysAgo },
          status: { [Op.ne]: 'inactive' },
        },
      },
    );
  }

  // ==================== ROLE CRUD ====================

  async createRole(dto: CreateRoleDto, req: any) {
    const newRole = await this.roleModel.create({
      roleId: require('uuid').v4(),
      roleName: dto.roleName,
    });

    await this.activityLogService.log({
      userId: req?.user?.userId,
      contextTag: 'SYSTEM',
      subContext: 'ROLE',
      action: 'CREATE_ROLE',
      entityId: newRole.roleId,
      entityName: newRole.roleName,
      description: `Role "${newRole.roleName}" created`,
      metadata: { createdVia: 'ADMIN_PANEL' },
      req,
    });

    return newRole;
  }

  async getAllRoles() {
    return this.roleModel.findAll({
      include: {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
      },
      order: [['roleName', 'ASC']],
    });
  }

  async getRoleById(roleId: string) {
    const role = await this.roleModel.findOne({
      where: { roleId },
      include: { model: Permission, as: 'permissions' },
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async deleteRole(roleId: string, req: any) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const associatedUsers = await this.userModel.count({ where: { roleId } });
    if (associatedUsers > 0) {
      throw new BadRequestException('Cannot delete role with associated users');
    }

    await this.rolePermissionModel.destroy({ where: { roleId } });
    await role.destroy();

    await this.activityLogService.log({
      userId: req?.user?.userId,
      contextTag: 'SYSTEM',
      subContext: 'ROLE',
      action: 'DELETE_ROLE',
      entityId: role.roleId,
      entityName: role.roleName,
      description: `Role "${role.roleName}" deleted`,
      oldValues: { roleId: role.roleId, roleName: role.roleName },
      metadata: { severity: 'critical', actionType: 'HARD_DELETE' },
      req,
    });

    return { message: 'Role deleted successfully' };
  }

  // ==================== ROLE PERMISSIONS ====================

  async assignPermissionsToRole(
    roleId: string,
    dto: AssignPermissionsToRoleDto,
    req: any,
  ) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const permissions = await this.permissionModel.findAll({
      where: { permissionId: dto.permissionIds },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('Some permissions are invalid');
    }

    const newAssignments = dto.permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    await this.rolePermissionModel.bulkCreate(newAssignments, {
      ignoreDuplicates: true,
    });

    await this.activityLogService.log({
      userId: req?.user?.userId,
      contextTag: 'SYSTEM',
      subContext: 'ROLE',
      action: 'ASSIGN_PERMISSION_TO_ROLE',
      entityId: roleId,
      entityName: role.roleName,
      description: `Permissions assigned to role ${role.roleName}`,
      metadata: { permissionIds: dto.permissionIds },
      req,
    });

    return { message: 'Permissions assigned successfully' };
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string | string[],
    req: any,
  ) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const permissionsToRemove = Array.isArray(permissionId)
      ? permissionId
      : [permissionId];

    const deletedCount = await this.rolePermissionModel.destroy({
      where: { roleId, permissionId: permissionsToRemove },
    });

    await this.activityLogService.log({
      userId: req?.user?.userId,
      contextTag: 'SYSTEM',
      subContext: 'ROLE',
      action: 'REMOVE_ROLE_PERMISSIONS',
      entityId: roleId,
      entityName: role.roleName,
      metadata: {
        removedPermissions: permissionsToRemove,
        removedCount: deletedCount,
      },
      req,
    });

    if (deletedCount === 0)
      throw new NotFoundException('Permissions not found or already removed');

    return { message: 'Permissions removed successfully' };
  }

  async updateRolePermissions(
    roleId: string,
    dto: UpdateRolePermissionsDto,
    req: any,
  ) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    // Validate permissions
    const validPermissions = await this.permissionModel.count({
      where: { permissionId: dto.permissionIds },
    });

    if (validPermissions !== dto.permissionIds.length) {
      throw new BadRequestException('Some permissions are invalid');
    }

    await this.rolePermissionModel.destroy({ where: { roleId } });

    const newAssignments = dto.permissionIds.map((pId) => ({
      roleId,
      permissionId: pId,
    }));
    await this.rolePermissionModel.bulkCreate(newAssignments);

    await this.activityLogService.log({
      userId: req?.user?.userId,
      contextTag: 'SYSTEM',
      subContext: 'ROLE',
      action: 'UPDATE_ROLE_PERMISSIONS',
      entityId: roleId,
      entityName: role.roleName,
      description: `Permissions updated for role ${role.roleName}`,
      metadata: {
        permissionCount: dto.permissionIds.length,
        replacedAll: true,
      },
      req,
    });

    return {
      message: 'Role permissions updated successfully',
      permissions: dto.permissionIds,
    };
  }

  async getRolePermissions(roleId: string) {
    const rolePermissions = await this.rolePermissionModel.findAll({
      where: { roleId },
      include: [
        { model: Role, attributes: ['roleId', 'roleName'] },
        {
          model: Permission,
          attributes: ['permissionId', 'module', 'name', 'route', 'api'],
        },
      ],
    });

    return {
      message: rolePermissions.length
        ? 'Permissions retrieved'
        : 'No permissions found',
      rolePermissions,
    };
  }
}
