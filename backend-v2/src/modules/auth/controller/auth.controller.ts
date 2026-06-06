// src/modules/auth/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, ResetPasswordDto } from '../dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    return this.authService.register(dto, req);
  }

  @Get('verify/:token')
  async verifyAccount(@Param('token') token: string) {
    return this.authService.verifyAccount(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string, @Req() req: any) {
    return this.authService.forgotPassword(email, req);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string, @Req() req: any) {
    return this.authService.resendVerificationEmail(email, req);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() dto: any, @Req() req: any) {
    return this.authService.changePassword(dto, req);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@Req() req: any) {
    return this.authService.getAllPermissionsOfLoggedInUser(req.user);
  }

  @Get('validate-token')
  @UseGuards(JwtAuthGuard)
  validateToken() {
    return { message: 'Token is valid' };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
