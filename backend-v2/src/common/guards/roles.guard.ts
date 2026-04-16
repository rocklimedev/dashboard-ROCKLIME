// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/rbac/entities/role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!allowedRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User role is not defined');
    }

    const userRole = await this.roleRepository.findOne({
      where: { roleId: user.roleId },
    });

    if (!userRole) {
      throw new ForbiddenException('Invalid role');
    }

    // SUPER_ADMIN bypass
    if (userRole.roleName === 'SUPER_ADMIN') {
      return true;
    }

    if (!allowedRoles.includes(userRole.roleName)) {
      throw new ForbiddenException('Access forbidden');
    }

    return true;
  }
}