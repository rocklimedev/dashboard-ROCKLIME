import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Client as FtpClient } from 'basic-ftp';
import * as sharp from 'sharp';

import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { Address } from '../models/address.model';
import { ActivityLogService } from '../activity-log/activity-log.service';

import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateStatusDto,
  AssignRoleDto,
} from './dto/user.dto';
import { ROLES } from '../config/constant';

@Injectable()
export class UserService {
  private readonly excludeSensitive = {
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
  };

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Address) private addressModel: typeof Address,
    private activityLogService: ActivityLogService,
    private sequelize: Sequelize,
  ) {}

  // ======================== CREATE USER ========================
  async createUser(dto: CreateUserDto, req: any) {
    const existingUser = await this.userModel.findOne({
      where: { [Op.or]: [{ username: dto.username }, { email: dto.email }] },
    });

    if (existingUser) {
      throw new ConflictException('Username or Email already exists');
    }

    const roleData = await this.roleModel.findByPk(dto.roleId);
    if (!roleData) {
      throw new BadRequestException('Invalid role specified');
    }

    if (dto.addressId) {
      const address = await this.addressModel.findByPk(dto.addressId);
      if (!address) throw new BadRequestException('Invalid address ID');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.userModel.create({
      ...dto,
      password: hashedPassword,
      roles: roleData.roleName,
      status: roleData.roleName === 'Users' ? 'inactive' : 'active',
      isEmailVerified: dto.isEmailVerified ?? false,
    });

    // Activity Log
    await this.activityLogService
      .log({
        userId: req?.user?.userId || null,
        contextTag: 'AUTH',
        subContext: 'USER',
        action: 'USER_CREATED',
        entityId: newUser.userId,
        entityName: newUser.name || newUser.username,
        description: `User "${newUser.username}" was created`,
        newValues: {
          username: newUser.username,
          email: newUser.email,
          role: roleData.roleName,
          status: newUser.status,
        },
        metadata: { roleId: dto.roleId },
        req,
      })
      .catch(console.error);

    return this.userModel.findByPk(newUser.userId, this.excludeSensitive);
  }

  // ======================== GET PROFILE ========================
  async getProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      ...this.excludeSensitive,
      include: [
        {
          model: Address,
          as: 'address',
          attributes: ['street', 'city', 'state', 'postalCode', 'country'],
        },
      ],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ======================== UPDATE PROFILE ========================
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.sequelize.transaction(async (t) => {
      const user = await this.userModel.findByPk(userId, { transaction: t });
      if (!user) throw new NotFoundException('User not found');

      // Duplicate username/email check
      if (dto.username || dto.email) {
        const exists = await this.userModel.findOne({
          where: {
            [Op.or]: [
              dto.username ? { username: dto.username } : null,
              dto.email ? { email: dto.email } : null,
            ].filter(Boolean),
            userId: { [Op.ne]: userId },
          },
          transaction: t,
        });
        if (exists)
          throw new ConflictException('Username or Email already exists');
      }

      // Update user fields
      Object.assign(user, {
        username: dto.username ?? user.username,
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        mobileNumber: dto.mobileNumber ?? user.mobileNumber,
        dateOfBirth: dto.dateOfBirth ?? user.dateOfBirth,
        bloodGroup: dto.bloodGroup ?? user.bloodGroup,
        emergencyNumber: dto.emergencyNumber ?? user.emergencyNumber,
        shiftFrom: dto.shiftFrom ?? user.shiftFrom,
        shiftTo: dto.shiftTo ?? user.shiftTo,
        photo_thumbnail: dto.photo_thumbnail ?? user.photo_thumbnail,
        photo_original: dto.photo_original ?? user.photo_original,
        about: dto.about ?? user.about,
      });

      // Handle Address
      if (dto.address) {
        if (user.addressId) {
          await this.addressModel.update(dto.address, {
            where: { addressId: user.addressId },
            transaction: t,
          });
        } else {
          const newAddr = await this.addressModel.create(
            { ...dto.address, userId: user.userId },
            { transaction: t },
          );
          user.addressId = newAddr.addressId;
        }
      }

      await user.save({ transaction: t });

      return this.getProfile(userId);
    });
  }

  // ======================== GET ALL USERS ========================
  async getAllUsers(query: any) {
    const {
      page = 1,
      limit = 20,
      searchTerm = '',
      sortBy = 'Recently Added',
      status = 'All',
    } = query;

    const offset = (page - 1) * limit;

    const where: any = {};
    if (searchTerm) {
      where[Op.or] = [
        { username: { [Op.like]: `%${searchTerm}%` } },
        { name: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { mobileNumber: { [Op.like]: `%${searchTerm}%` } },
      ];
    }
    if (status !== 'All') {
      where.status = status.toLowerCase();
    }

    let order: any = [['createdAt', 'DESC']];
    switch (sortBy) {
      case 'Ascending':
        order = [['name', 'ASC']];
        break;
      case 'Descending':
        order = [['name', 'DESC']];
        break;
      case 'Recently Added':
        order = [['createdAt', 'DESC']];
        break;
    }

    const users = await this.userModel.findAndCountAll({
      where,
      ...this.excludeSensitive,
      limit: +limit,
      offset,
      order,
    });

    const stats = {
      total: users.count,
      active: await this.userModel.count({ where: { status: 'active' } }),
      inactive: await this.userModel.count({ where: { status: 'inactive' } }),
      newJoiners: await this.userModel.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    };

    return {
      users: users.rows,
      total: users.count,
      page: +page,
      totalPages: Math.ceil(users.count / limit),
      stats,
    };
  }

  // ======================== GET USER BY ID ========================
  async getUserById(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      ...this.excludeSensitive,
      include: [{ model: Address, as: 'address' }],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ======================== UPDATE USER (Admin) ========================
  async updateUser(userId: string, dto: UpdateUserDto, req: any) {
    if (req.user.userId === userId) {
      throw new ForbiddenException('Use /profile endpoint for self-updates');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    // Duplicate check
    if (dto.username || dto.email) {
      const exists = await this.userModel.findOne({
        where: {
          [Op.or]: [
            dto.username ? { username: dto.username } : null,
            dto.email ? { email: dto.email } : null,
          ].filter(Boolean),
          userId: { [Op.ne]: userId },
        },
      });
      if (exists)
        throw new ConflictException('Username or Email already exists');
    }

    // Role Update
    if (dto.roleId) {
      const roleData = await this.roleModel.findByPk(dto.roleId);
      if (!roleData) throw new BadRequestException('Invalid role specified');

      user.roleId = roleData.roleId;
      user.roles = roleData.roleName;
      user.status = roleData.roleName === 'Users' ? 'inactive' : 'active';
    }

    // Update other fields
    Object.assign(user, dto);

    // Status validation for SuperAdmin
    if (dto.status) {
      if (user.roles.includes(ROLES.SuperAdmin) && dto.status !== 'active') {
        const superAdminCount = await this.userModel.count({
          where: { roles: { [Op.like]: `%${ROLES.SuperAdmin}%` } },
        });
        if (superAdminCount <= 1) {
          throw new BadRequestException(
            'Cannot deactivate the only remaining SuperAdmin',
          );
        }
      }
      user.status = dto.status;
    }

    await user.save();

    return this.getUserById(userId);
  }

  // ======================== DELETE USER ========================
  async deleteUser(userId: string, req: any) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.activityLogService.log({
      userId: req?.user?.userId || null,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'USER_DELETED',
      entityId: user.userId,
      entityName: user.name || user.username,
      description: `User "${user.username}" was deleted`,
      oldValues: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.roles,
        status: user.status,
      },
      req,
    });

    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  // ======================== ASSIGN ROLE ========================
  async assignRole(userId: string, dto: AssignRoleDto, req: any) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const roleData = await this.roleModel.findByPk(dto.roleId);
    if (!roleData) throw new BadRequestException('Invalid role specified');

    const oldRole = user.roles;
    const oldRoleId = user.roleId;
    const oldStatus = user.status;

    user.roles = roleData.roleName;
    user.roleId = roleData.roleId;
    user.status = roleData.roleName === 'Users' ? 'inactive' : 'active';

    await user.save();

    await this.activityLogService.log({
      userId: req?.user?.userId || null,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'USER_ROLE_ASSIGNED',
      entityId: user.userId,
      entityName: user.name || user.username,
      description: `Role changed from "${oldRole}" to "${roleData.roleName}"`,
      oldValues: { roleId: oldRoleId, role: oldRole, status: oldStatus },
      newValues: {
        roleId: roleData.roleId,
        role: roleData.roleName,
        status: user.status,
      },
      req,
    });

    return this.getUserById(userId);
  }

  // ======================== UPDATE STATUS ========================
  async updateStatus(userId: string, dto: UpdateStatusDto, req: any) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    if (req.user.userId === userId) {
      throw new ForbiddenException('You cannot change your own status');
    }

    const validStatuses = ['active', 'inactive', 'restricted'];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException('Invalid status');
    }

    if (user.roles.includes(ROLES.SuperAdmin) && dto.status !== 'active') {
      const count = await this.userModel.count({
        where: { roles: { [Op.like]: `%${ROLES.SuperAdmin}%` } },
      });
      if (count <= 1) {
        throw new BadRequestException('Cannot deactivate the only SuperAdmin');
      }
    }

    const oldStatus = user.status;
    user.status = dto.status;
    await user.save();

    await this.activityLogService.log({
      userId: req?.user?.userId || null,
      contextTag: 'AUTH',
      subContext: 'USER',
      action: 'USER_STATUS_UPDATED',
      entityId: user.userId,
      entityName: user.name || user.username,
      description: `Status changed from "${oldStatus}" to "${dto.status}"`,
      oldValues: { status: oldStatus },
      newValues: { status: dto.status },
      req,
    });

    return this.getUserById(userId);
  }

  // ======================== UPLOAD PHOTO ========================
  async uploadUserPhoto(file: Express.Multer.File, req: any) {
    if (!file) throw new BadRequestException('No photo uploaded');

    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, or WEBP images allowed');
    }

    const uid = uuidv4();
    const ext = path.extname(file.originalname);
    const originalName = `${uid}${ext}`;
    const thumbName = `${uid}_thumb${ext}`;

    const client = new FtpClient();
    let originalUrl: string, thumbUrl: string;

    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: +process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === 'true',
      });

      const uploadDir = '/user_photos';
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir);

      // Original
      await client.uploadFrom(file.buffer, originalName);
      await client.send(`SITE CHMOD 644 ${originalName}`);
      originalUrl = `https://media.cmtradingco.com${uploadDir}/${originalName}`;

      // Thumbnail
      const thumbBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover', withoutEnlargement: true })
        .toBuffer();

      await client.uploadFrom(thumbBuffer, thumbName);
      await client.send(`SITE CHMOD 644 ${thumbName}`);
      thumbUrl = `https://media.cmtradingco.com${uploadDir}/${thumbName}`;
    } catch (err) {
      throw new BadRequestException(`FTP upload failed: ${err.message}`);
    } finally {
      client.close();
    }

    const user = await this.userModel.findByPk(req.user.userId);
    if (!user) throw new NotFoundException('User not found');

    user.photo_original = originalUrl;
    user.photo_thumbnail = thumbUrl;
    await user.save();

    return {
      message: 'Photo uploaded successfully',
      photo_original: originalUrl,
      photo_thumbnail: thumbUrl,
      user: await this.getProfile(req.user.userId),
    };
  }

  // ======================== REPORT USER ========================
  async reportUser(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    // TODO: Implement proper reporting logic (Reports table)
    return { message: 'User reported successfully' };
  }
}
