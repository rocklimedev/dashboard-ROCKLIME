// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../users/entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(VerificationToken)
    private verificationTokenRepository: Repository<VerificationToken>,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      roleId: user.roleId,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET!, { expiresIn: '7d' });

    // Optional: Store refresh token in DB for better security
    await this.refreshTokenRepository.save({
      userId: user.userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      message: 'Login successful',
      accessToken,
      refreshToken, // or only send in cookie
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

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: normalizedEmail }],
    });
    if (existing) throw new ConflictException('Username or Email already exists');

    const usersRole = await this.roleRepository.findOneBy({ roleName: 'Users' });
    if (!usersRole) throw new BadRequestException('Users role not found');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      username: dto.username,
      name: dto.name,
      email: normalizedEmail,
      mobileNumber: dto.mobileNumber || null,
      password: hashedPassword,
      roles: usersRole.roleName,
      roleId: usersRole.roleId,
      status: 'inactive',
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create verification token
    const verificationToken = jwt.sign(
      { userId: savedUser.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' },
    );

    await this.verificationTokenRepository.save({
      userId: savedUser.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send verification email (uncomment when emails service is ready)
    // await this.emailsService.sendAccountVerification(savedUser.email, verificationToken);

    return {
      message: 'User registered successfully. Verification email sent.',
      user: {
        userId: savedUser.userId,
        username: savedUser.username,
        name: savedUser.name,
        email: savedUser.email,
        mobileNumber: savedUser.mobileNumber,
        roles: savedUser.roles,
        roleId: savedUser.roleId,
        status: savedUser.status,
        isEmailVerified: savedUser.isEmailVerified,
      },
    };
  }

  async verifyAccount(token: string) {
    const verification = await this.verificationTokenRepository.findOne({ where: { token } });
    if (!verification) throw new BadRequestException('Invalid or expired token');

    if (verification.isVerified) throw new BadRequestException('Account already verified');

    if (verification.expiresAt < new Date()) {
      await this.verificationTokenRepository.delete({ token });
      throw new BadRequestException('Token has expired');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        await this.verificationTokenRepository.delete({ token });
        throw new BadRequestException('Token has expired');
      }
      throw new BadRequestException('Invalid token');
    }

    const user = await this.userRepository.findOneBy({ userId: decoded.userId });
    if (!user) throw new BadRequestException('User not found');

    user.isEmailVerified = true;
    user.status = 'active';
    await this.userRepository.save(user);

    verification.isVerified = true;
    await this.verificationTokenRepository.save(verification);

    // Send confirmation email
    // await this.emailsService.sendVerificationConfirmation(user.email, user.name);

    return { message: 'Account verified successfully', isVerified: true, email: user.email };
  }

  async forgotPassword(email: string, host: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOneBy({ email: normalizedEmail });
    if (!user) throw new NotFoundException('User not found');

    const resetToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    await this.verificationTokenRepository.save({
      userId: user.userId,
      token: resetToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // await this.emailsService.sendResetPassword(user.email, resetToken, host);

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const verification = await this.verificationTokenRepository.findOne({
      where: { token: dto.resetToken, email: dto.email, isVerified: false },
    });
    if (!verification) throw new BadRequestException('Invalid or used token');

    if (verification.expiresAt < new Date()) {
      await this.verificationTokenRepository.delete({ token: dto.resetToken });
      throw new BadRequestException('Token has expired');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(dto.resetToken, process.env.JWT_SECRET!);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        await this.verificationTokenRepository.delete({ token: dto.resetToken });
        throw new BadRequestException('Token has expired');
      }
      throw new BadRequestException('Invalid token');
    }

    const user = await this.userRepository.findOneBy({ userId: decoded.userId });
    if (!user || user.email !== dto.email) throw new BadRequestException('Invalid token or email');

    if (dto.newPassword.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    verification.isVerified = true;
    await this.verificationTokenRepository.save(verification);

    // await this.emailsService.sendPasswordResetConfirmation(user.email);

    return { message: 'Password changed successfully' };
  }

  async resendVerificationEmail(email: string, host: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOneBy({ email: normalizedEmail });
    if (!user) throw new NotFoundException('User not found');

    if (user.isEmailVerified) throw new BadRequestException('Account is already verified');

    await this.verificationTokenRepository.delete({ userId: user.userId });

    const verificationToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '1d' });

    await this.verificationTokenRepository.save({
      userId: user.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // await this.emailsService.sendAccountVerification(user.email, verificationToken, host);

    return { message: 'Verification email sent successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOneBy({ userId });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    if (newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenRepository.delete({ token: refreshToken });
    }
    return { message: 'Logged out successfully' };
  }

  async getUserPermissions(userId: string) {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['role.rolePermissions.permission'],
    });

    if (!user?.role) return { permissions: [] };

    const permissions = user.role.rolePermissions.map((rp) => ({
      permissionId: rp.permission.permissionId,
      name: rp.permission.name,
      action: rp.permission.api,
      route: rp.permission.route,
      module: rp.permission.module,
    }));

    return { permissions, role: user.role.roleName, roleId: user.role.roleId };
  }
}