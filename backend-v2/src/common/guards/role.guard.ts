import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../models/role.model'; // Adjust path as needed

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Role) private roleModel: typeof Role,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get allowed role IDs from decorator
    const allowedRoleIds = this.reflector.get<string[]>(
      'allowedRoleIds',
      context.getHandler(),
    );

    // If no roles are specified, allow access (or you can throw error)
    if (!allowedRoleIds || allowedRoleIds.length === 0) {
      return true;
    }

    if (!user || !user.roleId) {
      throw new ForbiddenException('User role is not defined.');
    }

    try {
      // Check for Super Admin
      const superAdminRole = await this.roleModel.findOne({
        where: { roleName: 'SUPER_ADMIN' },
      });

      if (!superAdminRole) {
        throw new InternalServerErrorException(
          'Super Admin role configuration error.',
        );
      }

      // Super Admin always has access
      if (user.roleId === superAdminRole.roleId) {
        return true;
      }

      // Check if user's roleId is in allowed list
      if (!allowedRoleIds.includes(user.roleId)) {
        throw new ForbiddenException(
          'Access forbidden: Insufficient permissions.',
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An internal error occurred in role verification.',
      );
    }
  }
}
