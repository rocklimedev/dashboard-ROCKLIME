import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRolePermissionsDto,
} from './dto/role.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';

interface RequestContext {
  ip?: string;
  headers?: Record<string, any>;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Permission) private readonly permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private readonly rolePermissionModel: typeof RolePermission,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateRoleDto, actorId?: string, req?: RequestContext) {
    const newRole = await this.roleModel.create(dto as any);

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.SYSTEM,
        subContext: SUB_CONTEXTS.ROLE,
        action: 'CREATE_ROLE',
        entityId: newRole.roleId,
        entityName: newRole.roleName,
        description: `Role "${newRole.roleName}" created`,
        metadata: { roleId: newRole.roleId, roleName: newRole.roleName, createdVia: 'ADMIN_PANEL' },
        req,
      })
      .catch(() => {});

    return newRole;
  }

  findAll() {
    return this.roleModel.findAll({ include: [Permission] });
  }

  async findOne(roleId: string) {
    const role = await this.roleModel.findByPk(roleId, {
      include: [Permission],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async remove(roleId: string, actorId?: string, req?: RequestContext) {
    const role = await this.findOne(roleId);

    // Port of legacy guard: cannot delete a role with associated users.
    const associatedUsers = await this.userModel.findAll({ where: { roleId } });
    if (associatedUsers.length > 0) {
      throw new BadRequestException('Cannot delete role with associated users');
    }

    await this.rolePermissionModel.destroy({ where: { roleId } });

    const snapshot = { roleId: role.roleId, roleName: role.roleName };
    await role.destroy();

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.SYSTEM,
        subContext: SUB_CONTEXTS.ROLE,
        action: 'DELETE_ROLE',
        entityId: snapshot.roleId,
        entityName: snapshot.roleName,
        description: `Role "${snapshot.roleName}" deleted`,
        oldValues: snapshot,
        req,
      })
      .catch(() => {});

    return { message: 'Role deleted' };
  }

  /** Port of role.controller.js updateRolePermissions() - full replace */
  async updatePermissions(
    roleId: string,
    dto: UpdateRolePermissionsDto,
    actorId?: string,
    req?: RequestContext,
  ) {
    const role = await this.findOne(roleId);

    const validPermissions = await this.permissionModel.findAll({
      where: { permissionId: { [Op.in]: dto.permissionIds } },
    });
    if (validPermissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('Some permissions are invalid.');
    }

    await (role as any).$set('permissions', validPermissions);

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.SYSTEM,
        subContext: SUB_CONTEXTS.ROLE,
        action: 'UPDATE_ROLE_PERMISSIONS',
        entityId: roleId,
        entityName: role.roleName,
        description: `Permissions replaced for role "${role.roleName}"`,
        metadata: { roleId, permissionCount: validPermissions.length },
        req,
      })
      .catch(() => {});

    return this.findOne(roleId);
  }

  /**
   * Additive permission assignment. NOTE: this differs slightly from the
   * legacy assignPermissionToRole(), which only accepted a single
   * permissionId and returned 409 if it was already assigned - this
   * version accepts a batch and is idempotent (findOrCreate) instead.
   * Kept as the more useful shape; logs one ASSIGN_PERMISSION_TO_ROLE
   * activity per call rather than per permission.
   */
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    actorId?: string,
    req?: RequestContext,
  ) {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionModel.findAll({
      where: { permissionId: { [Op.in]: permissionIds } },
    });
    await Promise.all(
      permissions.map((permission) =>
        this.rolePermissionModel.findOrCreate({
          where: { roleId, permissionId: permission.permissionId },
        }),
      ),
    );

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.SYSTEM,
        subContext: SUB_CONTEXTS.ROLE,
        action: 'ASSIGN_PERMISSION_TO_ROLE',
        entityId: roleId,
        entityName: role.roleName,
        description: `Permission(s) assigned to role "${role.roleName}"`,
        metadata: { roleId, roleName: role.roleName, permissionIds },
        req,
      })
      .catch(() => {});

    return this.findOne(roleId);
  }

  async removePermission(
    roleId: string,
    permissionId: string,
    actorId?: string,
    req?: RequestContext,
  ) {
    const role = await this.findOne(roleId);
    await this.rolePermissionModel.destroy({ where: { roleId, permissionId } });

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.SYSTEM,
        subContext: SUB_CONTEXTS.ROLE,
        action: 'REMOVE_ROLE_PERMISSIONS',
        entityId: roleId,
        entityName: role.roleName,
        description: `Permission removed from role "${role.roleName}"`,
        metadata: { roleId, permissionId },
        req,
      })
      .catch(() => {});

    return this.findOne(roleId);
  }

  /** Port of role.controller.js assignRole() */
  async assignRole(dto: AssignRoleDto, actorId?: string, req?: RequestContext) {
    const user = await this.userModel.findByPk(dto.userId);
    if (!user) throw new BadRequestException('User not found');

    const roleData = await this.roleModel.findOne({
      where: { roleName: dto.role },
    });
    if (!roleData) throw new BadRequestException('Invalid role specified');

    if (dto.role === 'SUPER_ADMIN') {
      const existing = await this.userModel.findOne({
        where: { roles: { [Op.substring]: 'SUPER_ADMIN' } } as any,
      });
      if (existing) {
        throw new BadRequestException('A SuperAdmin already exists');
      }
    }

    const oldRoles = user.roles;
    const oldRoleId = user.roleId;
    const oldStatus = user.status;

    const currentRoles = user.roles || [];
    if (dto.role === 'USERS') {
      user.roles = ['USERS'];
      user.roleId = null as any;
      user.status = 'inactive';
    } else {
      if (!currentRoles.includes(dto.role)) currentRoles.push(dto.role);
      user.roles = currentRoles;
      user.roleId = roleData.roleId;
      user.status = 'active';
    }
    await user.save();

    // NOTE: the legacy version passed `userId` (the *target* user's id, a
    // function parameter) as the log's `userId` field, labelling it "actor"
    // in a comment - almost certainly a bug, since every other call site in
    // this codebase uses the acting/authenticated user for that field. This
    // port uses the real actor id (req.user.userId from the controller) and
    // keeps the target user in entityId/metadata instead.
    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'ASSIGN_ROLE',
        entityId: user.userId,
        entityName: user.username || user.email,
        description: `Role ${dto.role} assigned to user`,
        oldValues: { roles: oldRoles, roleId: oldRoleId, status: oldStatus },
        newValues: { roles: user.roles, roleId: user.roleId, status: user.status },
        req,
      })
      .catch(() => {});

    return { success: true, user };
  }

  findRecent() {
    return this.roleModel.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
  }
}
