import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put()
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('add')
  createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.usersService.createUser(dto, actorId, req);
  }

  @Put(':userId')
  updateUser(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(userId, dto);
  }

  @Delete(':userId')
  deleteUser(
    @Param('userId') userId: string,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.usersService.deleteUser(userId, actorId, req);
  }

  @Put(':userId/status')
  updateStatus(
    @Param('userId') userId: string,
    @Body('status') status: string,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.usersService.updateStatus(userId, status, actorId, req);
  }

  @Put(':userId/role')
  assignRole(
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.usersService.assignRole(userId, roleId, actorId, req);
  }

  // NOTE: photo upload (multer memoryStorage -> sharp resize) becomes a
  // NestJS FileInterceptor endpoint - see docs/MIGRATION_PLAN.md, "File
  // uploads".
}
