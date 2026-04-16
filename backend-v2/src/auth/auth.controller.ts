// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verify/:token')
  async verifyAccount(@Param('token') token: string) {
    return this.authService.verifyAccount(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string, @Req() req: any) {
    return this.authService.forgotPassword(email, req.headers.host);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string, @Req() req: any) {
    return this.authService.resendVerificationEmail(email, req.headers.host);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: any,
    @Body('password') password: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(req.user.userId, password, newPassword);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    return this.authService.logout(req.cookies?.refreshToken);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@Req() req: any) {
    return this.authService.getUserPermissions(req.user.userId);
  }

  @Get('validate-token')
  @UseGuards(JwtAuthGuard)
  validateToken() {
    return { message: 'Token is valid' };
  }
}