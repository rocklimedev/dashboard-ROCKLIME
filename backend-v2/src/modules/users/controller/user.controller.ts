import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../services/user.service';
import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateStatusDto,
  AssignRoleDto,
} from '../dto/user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ======================== CREATE USER (Admin Only) ========================
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.userService.createUser(dto, req);
  }

  // ======================== GET PROFILE (Current User) ========================
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.userId);
  }

  // ======================== UPDATE PROFILE (Current User) ========================
  @Put('profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  // ======================== UPLOAD PHOTO ========================
  @Post('photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.userService.uploadUserPhoto(file, req);
  }

  // ======================== GET ALL USERS (Admin) ========================
  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async getAllUsers(@Query() query: any) {
    return this.userService.getAllUsers(query);
  }

  // ======================== GET USER BY ID ========================
  @Get(':userId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async getUserById(@Param('userId') userId: string) {
    return this.userService.getUserById(userId);
  }

  // ======================== UPDATE USER (Admin) ========================
  @Put(':userId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.userService.updateUser(userId, dto, req);
  }

  // ======================== DELETE USER ========================
  @Delete(':userId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async deleteUser(@Param('userId') userId: string, @Req() req: any) {
    return this.userService.deleteUser(userId, req);
  }

  // ======================== ASSIGN ROLE ========================
  @Put(':userId/role')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: any,
  ) {
    return this.userService.assignRole(userId, dto, req);
  }

  // ======================== UPDATE STATUS ========================
  @Put(':userId/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: any,
  ) {
    return this.userService.updateStatus(userId, dto, req);
  }

  // ======================== REPORT USER ========================
  @Post(':userId/report')
  async reportUser(@Param('userId') userId: string) {
    return this.userService.reportUser(userId);
  }

  // Optional: Change status to inactive (if you still need this separate endpoint)
  @Put(':userId/inactive')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async changeToInactive(@Param('userId') userId: string, @Req() req: any) {
    return this.userService.updateStatus(userId, { status: 'inactive' }, req);
  }
}
