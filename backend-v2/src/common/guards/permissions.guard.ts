import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/permissions.decorator';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';

/**
 * Direct port of legacy middleware/permission.js.
 *
 * The legacy version cached the flattened permission list per-user in
 * MongoDB for 24h (CachedPermission model) to avoid hitting MySQL on every
 * request. That cache can be reintroduced here with @nestjs/mongoose or,
 * preferably, a Redis cache (see docs/MIGRATION_PLAN.md, "Permission cache").
 * This version queries MySQL directly - functionally equivalent, just
 * without the cache layer for now.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<RequiredPermission>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // No @RequirePermission on this route -> only JwtAuthGuard applies.
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const decoded = request.user;
    if (!decoded?.userId) {
      throw new UnauthorizedException('Unauthorized: Invalid token');
    }

    const user = await this.userModel.findByPk(decoded.userId, {
      include: [{ model: Role, include: [{ model: Permission }] }],
    });

    if (!user) throw new NotFoundException('User not found');

    const role = (user as any).role as Role & { permissions?: Permission[] };

    // Super admin bypass, same as legacy.
    if (role?.roleName?.toUpperCase() === 'SUPER_ADMIN') return true;

    const { api, name, module, route } = required;
    if (!api || !name || !module || !route) {
      throw new InternalServerErrorException(
        'Invalid permission configuration in route',
      );
    }

    const permissions = role?.permissions || [];
    const hasPermission = permissions.some(
      (perm) =>
        perm.api === api &&
        perm.name === name &&
        perm.module === module &&
        perm.route === route,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Forbidden: Missing permission "${name}" (${api.toUpperCase()} - ${module})`,
      );
    }

    return true;
  }
}
