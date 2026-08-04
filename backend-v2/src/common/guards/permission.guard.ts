import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PERMISSION_KEY, PermissionMetadata } from '../decorators/permission.decorator';
import { User } from '@/modules/users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import { Permission as PermissionEntity } from '@/modules/rbac/models/permission.model';

import {
  CachedPermission,
  CachedPermissionDocument,
} from '@/modules/rbac/models/cached-permission.model';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,

    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectMongoModel(CachedPermission.name)
    private readonly cachedPermissionModel: Model<CachedPermissionDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Route doesn't require permission
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Unauthorized: No token provided');
    }

    let decoded: any;

    try {
      decoded = await this.jwtService.verifyAsync(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }

      throw new UnauthorizedException('Invalid token');
    }

    if (!decoded.userId) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = decoded;

    let cached = await this.cachedPermissionModel.findOne({
      userId: decoded.userId,
    });

    const isFresh =
      cached &&
      Date.now() - new Date(cached.fetchedAt).getTime() <
        24 * 60 * 60 * 1000;

    if (!isFresh) {
      const user = await this.userModel.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            include: [
              {
                model: PermissionEntity,
                through: {
                  attributes: [],
                },
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const roles = user.Roles || [];

      const permissions = roles.flatMap((role) =>
        role.Permissions.map((perm) => ({
          permissionId: perm.permissionId,
          name: perm.name,
          api: perm.api,
          route: perm.route,
          module: perm.module,
        })),
      );

      await this.cachedPermissionModel.findOneAndUpdate(
        {
          userId: decoded.userId,
        },
        {
          roleId: roles[0]?.roleId,
          roleName: roles[0]?.roleName ?? null,
          permissions,
          fetchedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        },
      );

      cached = await this.cachedPermissionModel.findOne({
        userId: decoded.userId,
      });
    }

    if (cached?.roleName?.toUpperCase() === 'SUPER_ADMIN') {
      return true;
    }

    if (
      !permission.api ||
      !permission.name ||
      !permission.module ||
      !permission.route
    ) {
      throw new InternalServerErrorException(
        'Invalid permission configuration',
      );
    }

    const hasPermission = cached.permissions.some(
      (perm) =>
        perm.api === permission.api &&
        perm.name === permission.name &&
        perm.module === permission.module &&
        perm.route === permission.route,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing permission "${permission.name}" (${permission.api.toUpperCase()} - ${permission.module})`,
      );
    }

    return true;
  }
}