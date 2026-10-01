import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { User, ROLES } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Address } from '../address/entities/address.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';

interface RequestContext {
  ip?: string;
  headers?: Record<string, any>;
}

const excludeSensitiveFields = { attributes: { exclude: ['password'] } };

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Address) private readonly addressModel: typeof Address,
    private readonly activityLog: ActivityLogService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      include: [Role],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    await user.update(dto as any);
    return this.getProfile(userId);
  }

  findAll() {
    return this.userModel.findAll({
      include: [Role],
      attributes: { exclude: ['password'] },
    });
  }

  /** Port of user.controller.js createUser() (admin-panel user creation) */
  async createUser(dto: CreateUserDto, actorId?: string, req?: RequestContext) {
    const existing = await this.userModel.findOne({
      where: { [Op.or]: [{ username: dto.username }, { email: dto.email }] } as any,
    });
    if (existing) throw new BadRequestException('Username or Email already exists');

    let roleData: Role | null = null;
    if (dto.roleId) {
      roleData = await Role.findOne({ where: { roleId: dto.roleId } });
      if (!roleData) throw new BadRequestException('Invalid role specified');
    }

    if (dto.addressId) {
      const address = await this.addressModel.findByPk(dto.addressId);
      if (!address) throw new BadRequestException('Invalid address ID');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await this.userModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      roles: roleData ? [roleData.roleName] : undefined,
      status: roleData?.roleName === 'Users' ? 'inactive' : 'active',
    } as any);

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'USER_CREATED',
        entityId: newUser.userId,
        entityName: newUser.name || newUser.username,
        description: `User "${newUser.username}" was created`,
        newValues: {
          userId: newUser.userId,
          username: newUser.username,
          email: newUser.email,
          role: roleData?.roleName ?? null,
          status: newUser.status,
        },
        metadata: { roleId: dto.roleId ?? null, addressId: dto.addressId ?? null },
        req,
      })
      .catch(() => {});

    return this.userModel.findByPk(newUser.userId, excludeSensitiveFields);
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    return this.updateProfile(userId, dto);
  }

  async deleteUser(userId: string, actorId?: string, req?: RequestContext) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const snapshot = {
      userId: user.userId,
      username: user.username,
      name: user.name,
      email: user.email,
    };

    await user.destroy();

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'USER_DELETED',
        entityId: snapshot.userId,
        entityName: snapshot.name || snapshot.username,
        description: `User "${snapshot.username}" was deleted`,
        oldValues: snapshot,
        req,
      })
      .catch(() => {});

    return { message: 'User deleted' };
  }

  /** Port of user.controller.js changeUserStatus() - the more complete of
   * the two legacy status-change endpoints (also handles the simpler
   * changeStatusToInactive() case, since that's a strict subset). */
  async updateStatus(
    userId: string,
    status: string,
    actorId: string,
    req?: RequestContext,
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    if (actorId === userId) {
      throw new ForbiddenException('You cannot change your own status');
    }

    if (user.roles?.includes(ROLES.SuperAdmin) && status !== 'active') {
      const superAdminCount = await this.userModel.count({
        where: { roles: { [Op.like]: `%${ROLES.SuperAdmin}%` } } as any,
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot deactivate or restrict the only SuperAdmin');
      }
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'USER_STATUS_UPDATED',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `Status for user "${user.username}" changed from ${oldStatus} to ${status}`,
        oldValues: { status: oldStatus },
        newValues: { status },
        req,
      })
      .catch(() => {});

    return { message: 'User status updated successfully', status: user.status };
  }

  /** Port of user.controller.js assignRole() */
  async assignRole(userId: string, roleId: string, actorId?: string, req?: RequestContext) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const roleData = await Role.findOne({ where: { roleId } });
    if (!roleData) throw new BadRequestException('Invalid role specified');

    const oldRole = user.roles;
    const oldRoleId = user.roleId;
    const oldStatus = user.status;

    user.roles = [roleData.roleName];
    user.roleId = roleData.roleId;
    user.status = roleData.roleName === 'Users' ? 'inactive' : 'active';
    await user.save();

    this.activityLog
      .logActivity({
        userId: actorId ?? null,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'USER_ROLE_ASSIGNED',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `Role "${roleData.roleName}" assigned to user "${user.username}"`,
        oldValues: { roles: oldRole, roleId: oldRoleId, status: oldStatus },
        newValues: { roles: user.roles, roleId: user.roleId, status: user.status },
        req,
      })
      .catch(() => {});

    return { message: 'Role assigned successfully', user: await this.getProfile(userId) };
  }
}
