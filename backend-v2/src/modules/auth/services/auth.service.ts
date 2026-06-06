// src/modules/auth/services/auth.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/modules/roles/entities/role.entity';
import { RolePermission } from '@/modules/roles/entities/role-permission.entity';
import { Permission } from '@/modules/roles/entities/permission.entity';
import { VerificationToken } from '../entities/verification-token.entity';

import { ActivityLoggerService } from '@/common/services/activity-logger.service';
import { EmailService } from '@/common/services/email.service';

import { LoginDto, RegisterDto, ResetPasswordDto, ChangePasswordDto } from '../dto';
import { ROLES } from '@/config/constants';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(VerificationToken) private readonly verificationModel: typeof VerificationToken,
    @InjectModel(RolePermission) private readonly rolePermissionModel: typeof RolePermission,
    @InjectModel(Permission) private readonly permissionModel: typeof Permission,

    private readonly activityLogger: ActivityLoggerService,
    private readonly emailService: EmailService,
    private readonly sequelize: Sequelize,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────
  async login(dto: LoginDto, req: any) {
    const { email, password } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.userModel.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const now = Math.floor(Date.now() / 1000);

    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
        iat: now,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
      },
      REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    // Activity Log
    this.activityLogger
      .log({
        userId: user.userId,
        contextTag: 'AUTH',
        subContext: 'USER',
        action: 'LOGIN_SUCCESS',
        entityId: user.userId,
        entityName: user.name || user.username,
        description: `User "${user.username}" logged in successfully`,
        metadata: {
          email: user.email,
          role: user.roles,
          status: user.status,
        },
        req,
      })
      .catch(console.error);

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

  // ─────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────
  async register(dto: RegisterDto, req: any) {
    const { username, name, email, mobileNumber, password } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await this.userModel.findOne({
      where: { [Op.or]: [{ username }, { email: normalizedEmail }] },
    });

    if (existingUser) {
      throw new ConflictException('Username or Email already exists');
    }

    const defaultRole = await this.roleModel.findOne({
      where: { roleName: ROLES.Users },
    });

    if (!defaultRole) {
      throw new BadRequestException('Default user role not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      name,
      email: normalizedEmail,
      mobileNumber: mobileNumber || null,
      password: hashedPassword,
      roles: [defaultRole.roleName],
      roleId: defaultRole.roleId,
      status: 'inactive',
      isEmailVerified: false,
    });

    const verificationToken = jwt.sign(
      { userId: user.userId },
      JWT_SECRET,
      { expiresIn: '1d' },
    );

    await this.verificationModel.create({
      userId: user.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send verification email
    // await this.emailService.sendAccountVerification(user.email, verificationToken, req.headers.host);

    this.activityLogger.log({ ... /* similar to original */ }).catch(console.error);

    return {
      message: 'User registered successfully. Verification email sent.',
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        roles: user.roles,
        roleId: user.roleId,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // VERIFY ACCOUNT
  // ─────────────────────────────────────────────────────────────
  async verifyAccount(token: string) {
    const verification = await this.verificationModel.findOne({ where: { token } });

    if (!verification) throw new BadRequestException('Invalid or expired token');
    if (verification.isVerified) throw new BadRequestException('Account already verified');
    if (verification.expiresAt < new Date()) {
      await verification.destroy();
      throw new BadRequestException('Token has expired');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await this.userModel.findByPk(decoded.userId);

    if (!user) throw new BadRequestException('User not found');

    user.isEmailVerified = true;
    user.status = 'active';
    await user.save();

    verification.isVerified = true;
    await verification.save();

    this.activityLogger.log({
      userId: user.userId,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'ACCOUNT_VERIFIED',
      entityId: user.userId,
      entityName: user.name || user.username,
      description: `Account verified for user "${user.username}"`,
      oldValues: { isEmailVerified: false, status: 'inactive' },
      newValues: { isEmailVerified: true, status: 'active' },
      metadata: { email: user.email },
    }).catch(console.error);

    // Send confirmation email
    // await this.emailService.sendVerificationConfirmation(user.email, user.name);

    return { message: 'Account verified successfully', isVerified: true };
  }

  // ─────────────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────────────
  async forgotPassword(email: string, req: any) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userModel.findOne({ where: { email: normalizedEmail } });

    if (!user) throw new NotFoundException('User not found');

    const resetToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '15m' });

    await this.verificationModel.create({
      userId: user.userId,
      token: resetToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // await this.emailService.sendResetPasswordEmail(user.email, resetToken, req.headers.host);

    return { message: 'Password reset link sent to your email' };
  }

  // ─────────────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const { resetToken, newPassword, email } = dto;

    const verification = await this.verificationModel.findOne({
      where: { token: resetToken, email, isVerified: false },
    });

    if (!verification) throw new BadRequestException('Invalid or used token');
    if (verification.expiresAt < new Date()) {
      await verification.destroy();
      throw new BadRequestException('Token has expired');
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET) as any;
    const user = await this.userModel.findByPk(decoded.userId);

    if (!user || user.email !== email) {
      throw new BadRequestException('Invalid token or email');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    verification.isVerified = true;
    await verification.save();

    // await this.emailService.sendPasswordResetConfirmation(user.email);

    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // RESEND VERIFICATION EMAIL
  // ─────────────────────────────────────────────────────────────
  async resendVerificationEmail(email: string, req: any) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userModel.findOne({ where: { email: normalizedEmail } });

    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Account is already verified');

    // Delete old tokens
    await this.verificationModel.destroy({ where: { userId: user.userId } });

    const verificationToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1d' });

    await this.verificationModel.create({
      userId: user.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // await this.emailService.sendAccountVerification(user.email, verificationToken, req.headers.host);

    return { message: 'Verification email sent successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // CHANGE PASSWORD (Authenticated)
  // ─────────────────────────────────────────────────────────────
  async changePassword(dto: ChangePasswordDto, req: any) {
    const { password: currentPassword, newPassword } = dto;
    const { userId } = req.user;

    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    this.activityLogger.log({
      userId: user.userId,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'PASSWORD_CHANGED',
      entityId: user.userId,
      entityName: user.name || user.username,
      description: `Password changed successfully for user "${user.username}"`,
      metadata: { email: user.email },
      req,
    }).catch(console.error);

    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // GET PERMISSIONS OF LOGGED IN USER
  // ─────────────────────────────────────────────────────────────
  async getAllPermissionsOfLoggedInUser(user: any) {
    const role = await this.roleModel.findByPk(user.roleId, {
      attributes: ['roleId', 'roleName'],
      include: [
        {
          model: RolePermission,
          as: 'rolepermissions',
          attributes: ['permissionId'],
          include: [
            {
              model: Permission,
              as: 'permission',
              attributes: ['permissionId', 'name', 'api', 'route', 'module'],
            },
          ],
        },
      ],
    });

    if (!role) throw new NotFoundException('Role not found');

    const permissions = role.rolepermissions.map((rp) => ({
      permissionId: rp.permission.permissionId,
      name: rp.permission.name,
      action: rp.permission.api,
      route: rp.permission.route,
      module: rp.permission.module,
    }));

    return {
      permissions,
      role: role.roleName,
      roleId: role.roleId,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATE TOKEN
  // ─────────────────────────────────────────────────────────────
  async validateToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await this.userModel.findByPk(decoded.userId);

      if (!user) throw new UnauthorizedException('User not found');
      if (user.status !== 'active') throw new UnauthorizedException('Account is inactive');

      return { valid: true, userId: decoded.userId };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DEACTIVATE ACCOUNT
  // ─────────────────────────────────────────────────────────────
  async deactivateAccount(req: any) {
    const { userId } = req.user;
    const user = await this.userModel.findByPk(userId);

    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'inactive') throw new BadRequestException('Account is already deactivated');
    if (user.roles.includes(ROLES.SuperAdmin)) {
      throw new UnauthorizedException('SuperAdmin account cannot be deactivated');
    }

    const oldStatus = user.status;
    user.status = 'inactive';
    await user.save();

    this.activityLogger.log({
      userId: user.userId,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'ACCOUNT_DEACTIVATED',
      entityId: user.userId,
      entityName: user.name || user.username,
      description: `Account deactivated by user "${user.username}"`,
      oldValues: { status: oldStatus },
      newValues: { status: 'inactive' },
      metadata: { email: user.email, selfDeactivated: true },
      req,
    }).catch(console.error);

    return { message: 'Account deactivated successfully' };
  }
}