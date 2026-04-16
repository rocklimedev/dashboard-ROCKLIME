// src/roles/roles.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Role } from './entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async assignRole(dto: AssignRoleDto) {
    const user = await this.userRepository.findOneBy({ id: dto.userId }); // adjust field if needed
    if (!user) throw new NotFoundException('User not found');

    const roleData = await this.roleRepository.findOneBy({ roleName: dto.role });
    if (!roleData) throw new BadRequestException('Invalid role specified');

    // SuperAdmin uniqueness check
    if (dto.role === 'SuperAdmin') {
      const existing = await this.userRepository.findOne({
        where: { roles: { $like: '%SuperAdmin%' } as any },
      });
      if (existing) throw new BadRequestException('A SuperAdmin already exists');
    }

    let userRoles = user.roles ? user.roles.split(',') : [];

    if (dto.role === 'Users') {
      user.roles = 'Users';
      user.roleId = null;
      user.status = 'inactive';
    } else {
      if (!userRoles.includes(dto.role)) {
        userRoles.push(dto.role);
      }
      user.roles = userRoles.join(',');
      user.roleId = roleData.roleId;
      user.status = 'active';
    }

    await this.userRepository.save(user);
    return { success: true, message: `Role ${dto.role} assigned successfully` };
  }

  async getRecentRoleToGive() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const users = await this.userRepository.find({
      where: [
        { roleId: null },
        { createdAt: { $gte: fourteenDaysAgo } as any, status: 'inactive' },
      ],
      relations: ['role'],
    });

    if (!users.length || users.every((u) => u.roleId !== null)) {
      return { success: true, message: 'No users left for role assignment' };
    }

    return { success: true, users };
  }

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.roleRepository.findOneBy({ roleName: createRoleDto.roleName });
    if (existing) throw new BadRequestException('Role already exists');

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll() {
    return this.roleRepository.find({
      relations: ['rolePermissions.permission'],
      order: { roleName: 'ASC' },
    });
  }

  async findOne(roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { roleId },
      relations: ['rolePermissions.permission'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async remove(roleId: string) {
    const role = await this.findOne(roleId);

    const associatedUsers = await this.userRepository.count({ where: { roleId } });
    if (associatedUsers > 0) {
      throw new BadRequestException('Cannot delete role with associated users');
    }

    await this.roleRepository.remove(role);
    return { message: 'Role deleted successfully' };
  }

  // Auto-set inactive status after 7 days without role
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkUserRoleStatus() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await this.userRepository.update(
      {
        roleId: null,
        createdAt: { $lte: sevenDaysAgo } as any,
        status: { $ne: 'inactive' } as any,
      },
      { status: 'inactive' },
    );
  }
}