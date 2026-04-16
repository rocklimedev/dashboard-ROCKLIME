// src/role-permissions/role-permissions.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private rpRepository: Repository<RolePermission>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.roleRepository.findOneBy({ roleId });
    const permission = await this.permissionRepository.findOneBy({ permissionId });

    if (!role) throw new NotFoundException('Role not found');
    if (!permission) throw new NotFoundException('Permission not found');

    const existing = await this.rpRepository.findOne({ where: { roleId, permissionId } });
    if (existing) throw new ConflictException('Permission already assigned to role');

    const rp = this.rpRepository.create({ roleId, permissionId });
    return this.rpRepository.save(rp);
  }

  async removePermission(roleId: string, permissionId: string) {
    const result = await this.rpRepository.delete({ roleId, permissionId });
    if (result.affected === 0) throw new NotFoundException('Permission not assigned to role');
    return { message: 'Permission removed successfully' };
  }

  async getRolePermissions(roleId: string) {
    return this.rpRepository.find({
      where: { roleId },
      relations: ['role', 'permission'],
    });
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.roleRepository.findOneBy({ roleId });
    if (!role) throw new NotFoundException('Role not found');

    // Clear existing
    await this.rpRepository.delete({ roleId });

    // Add new
    const newRps = permissionIds.map((permissionId) => ({ roleId, permissionId }));
    await this.rpRepository.save(newRps);

    return { message: 'Role permissions updated successfully', roleId, permissions: permissionIds };
  }
}