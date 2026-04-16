// src/common/guards/admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/rbac/entities/role.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // ✅ Check if user exists
    if (!user || !user.roleId) {
      throw new ForbiddenException('User role is not defined');
    }

    // ✅ Get SUPER_ADMIN role
    const superAdminRole = await this.roleRepository.findOne({
      where: { roleName: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new InternalServerErrorException(
        'Super Admin role configuration error',
      );
    }

    // ✅ Allow SUPER_ADMIN always
    if (user.roleId === superAdminRole.roleId) {
      return true;
    }

    // ✅ Only allow ADMIN (you can extend this)
    const adminRole = await this.roleRepository.findOne({
      where: { roleName: 'ADMIN' },
    });

    if (!adminRole || user.roleId !== adminRole.roleId) {
      throw new ForbiddenException(
        'Access forbidden: Insufficient permissions',
      );
    }

    return true;
  }
}