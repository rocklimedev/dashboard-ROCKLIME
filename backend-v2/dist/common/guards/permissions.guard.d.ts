import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../modules/users/entities/user.entity';
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private readonly userModel;
    constructor(reflector: Reflector, userModel: typeof User);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
