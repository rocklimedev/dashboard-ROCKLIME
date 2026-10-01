import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel as InjectSequelizeModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';

import { User, ROLES } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { VerificationToken } from './schemas/verification-token.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';

interface RequestContext {
  ip?: string;
  headers?: Record<string, any>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectSequelizeModel(User) private readonly userModel: typeof User,
    @InjectSequelizeModel(Role) private readonly roleModel: typeof Role,
    @InjectMongoModel(VerificationToken.name)
    private readonly verificationTokenModel: MongoModel<VerificationToken>,
    @InjectMongoModel(RefreshToken.name)
    private readonly refreshTokenModel: MongoModel<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private signAccessToken(user: User) {
    return this.jwtService.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1000),
      },
      {
        secret: this.config.get('jwt.secret'),
        expiresIn: this.config.get('jwt.accessExpiresIn'),
      },
    );
  }

  private signRefreshToken(user: User) {
    return this.jwtService.sign(
      { userId: user.userId, email: user.email, roles: user.roles, roleId: user.roleId },
      {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiresIn'),
      },
    );
  }

  async login(dto: LoginDto, req?: RequestContext) {
    const user = await this.userModel.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new BadRequestException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new BadRequestException('Invalid credentials');

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    this.activityLog
      .logActivity({
        userId: user.userId,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'LOGIN_SUCCESS',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `User "${user.username}" logged in successfully`,
        metadata: { email: user.email, role: user.roles, status: user.status },
        req,
      })
      .catch(() => {});

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        name: user.name,
        mobileNumber: user.mobileNumber,
        roles: user.roles,
        roleId: user.roleId,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async register(dto: RegisterDto, req?: RequestContext) {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.userModel.findOne({
      where: {
        [Op.or]: [{ username: dto.username }, { email: normalizedEmail }],
      } as any,
    });
    if (existing) {
      throw new BadRequestException('Username or Email already exists');
    }

    const roleData = await this.roleModel.findOne({
      where: { roleName: ROLES.Users },
    });
    if (!roleData) throw new BadRequestException('USERS role not found');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await this.userModel.create({
      username: dto.username,
      name: dto.name,
      email: normalizedEmail,
      mobileNumber: dto.mobileNumber ?? null,
      password: hashedPassword,
      roles: [roleData.roleName],
      roleId: roleData.roleId,
      status: 'inactive',
      isEmailVerified: false,
    } as any);

    const verificationToken = this.jwtService.sign(
      { userId: newUser.userId },
      { secret: this.config.get('jwt.secret'), expiresIn: '1d' },
    );

    await this.verificationTokenModel.create({
      userId: newUser.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // TODO: send the verification email (see middleware/sendMail.js /
    // config/template.js).

    this.activityLog
      .logActivity({
        userId: newUser.userId,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'USER_REGISTERED',
        entityId: newUser.userId,
        entityName: newUser.name || newUser.username,
        description: `New user "${newUser.username}" registered`,
        newValues: {
          userId: newUser.userId,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          mobileNumber: newUser.mobileNumber,
          role: roleData.roleName,
          status: newUser.status,
          isEmailVerified: newUser.isEmailVerified,
        },
        metadata: { registrationType: 'SELF_REGISTRATION', verificationEmailSent: true },
        req,
      })
      .catch(() => {});

    return {
      message: 'User registered successfully. Verification email sent.',
      user: {
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        roles: newUser.roles,
        roleId: newUser.roleId,
        status: newUser.status,
        createdAt: (newUser as any).createdAt,
        isEmailVerified: newUser.isEmailVerified,
      },
    };
  }

  async verifyAccount(token: string) {
    const verification = await this.verificationTokenModel.findOne({ token });
    if (!verification) throw new BadRequestException('Invalid or expired token');
    if (verification.isVerified)
      throw new BadRequestException('Account already verified');

    if (verification.expiresAt < new Date()) {
      await this.verificationTokenModel.deleteOne({ token });
      throw new BadRequestException('Token has expired');
    }

    let decoded: any;
    try {
      decoded = this.jwtService.verify(token, {
        secret: this.config.get('jwt.secret'),
      });
    } catch (err: any) {
      await this.verificationTokenModel.deleteOne({ token });
      throw new BadRequestException(
        err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
      );
    }

    const user = await this.userModel.findByPk(decoded.userId);
    if (!user) throw new BadRequestException('User not found');

    user.isEmailVerified = true;
    user.status = 'active';
    await user.save();

    verification.isVerified = true;
    await verification.save();

    this.activityLog
      .logActivity({
        userId: user.userId,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'ACCOUNT_VERIFIED',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `Account verified for user "${user.username}"`,
        oldValues: { isEmailVerified: false, status: 'inactive' },
        newValues: { isEmailVerified: true, status: 'active' },
      })
      .catch(() => {});

    return { message: 'Account verified successfully' };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');

    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken, {
        secret: this.config.get('jwt.refreshSecret'),
      });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findByPk(decoded.userId);
    if (!user) throw new NotFoundException('User not found');

    return { accessToken: this.signAccessToken(user) };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, req?: RequestContext) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new BadRequestException('Old password is incorrect');

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }
    if (dto.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is inactive or restricted');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    this.activityLog
      .logActivity({
        userId: user.userId,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'PASSWORD_CHANGED',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `Password changed successfully for user "${user.username}"`,
        metadata: { email: user.email, changedBy: user.userId },
        req,
      })
      .catch(() => {});

    return { message: 'Password changed successfully' };
  }

  async deactivateAccount(userId: string, req?: RequestContext) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.status === 'inactive') {
      throw new BadRequestException('Account is already deactivated');
    }
    if (user.roles?.includes(ROLES.SuperAdmin)) {
      throw new ForbiddenException('SuperAdmin account cannot be deactivated');
    }

    // NOTE: legacy deactivateAccount() referenced an `oldStatus` variable
    // in its logActivity call that was never assigned anywhere in the
    // function - a ReferenceError on every request. Captured correctly
    // here before the mutation.
    const oldStatus = user.status;
    user.status = 'inactive';
    await user.save();

    this.activityLog
      .logActivity({
        userId: user.userId,
        contextTag: CONTEXT_TAGS.AUTH,
        subContext: SUB_CONTEXTS.USER,
        action: 'ACCOUNT_DEACTIVATED',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `Account deactivated by user "${user.username}"`,
        oldValues: { status: oldStatus },
        newValues: { status: 'inactive' },
        metadata: { email: user.email, deactivatedBy: user.userId, selfDeactivated: true },
        req,
      })
      .catch(() => {});

    return {
      message: 'Account deactivated successfully. You can reactivate by logging in again.',
    };
  }

  async getPermissionsForUser(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      include: [{ model: Role, include: [{ model: Permission }] }],
    });
    if (!user) throw new NotFoundException('User not found');

    const role = (user as any).role as Role & { permissions?: Permission[] };
    return {
      role: role?.roleName ?? null,
      permissions: role?.permissions ?? [],
    };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.config.get('jwt.secret'),
      });
      return { valid: true, decoded };
    } catch {
      return { valid: false };
    }
  }

  // TODO: forgotPassword / resetPassword / validateResetToken /
  // resendVerificationEmail / logout(revoke refresh token) - port from
  // auth.controller.js following the same pattern as above. logout in the
  // legacy code just clears the httpOnly cookie; here that becomes clearing
  // the cookie in the controller layer (see auth.controller.ts).
}
