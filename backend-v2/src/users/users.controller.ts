// src/users/users.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return this.usersService.findProfile(req.user.userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get()
  @UseGuards(AdminGuard)
  getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('sortBy') sortBy?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll(page, limit, searchTerm, sortBy, status);
  }

  @Get(':userId')
  @UseGuards(AdminGuard)
  getUserById(@Param('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Put(':userId')
  @UseGuards(AdminGuard)
  updateUser(@Param('userId') userId: string, @Body() dto: UpdateUserDto, @Req() req) {
    return this.usersService.update(userId, dto, req.user.userId);
  }

  @Post('photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadPhoto(req.user.userId, file);
  }
}