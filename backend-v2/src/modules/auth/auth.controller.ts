import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('validate-reset-token/:token')
  validateResetToken(@Param('token') token: string) {
    return this.authService.validateToken(token);
  }

  @Get('verify-account/:token')
  verifyAccount(@Param('token') token: string) {
    return this.authService.verifyAccount(token);
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.login(dto, req);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const { refreshToken, ...body } = result;
    return body;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(userId, dto, req);
  }

  @Post('refresh-token')
  refreshToken(@Req() req: Request) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    return this.authService.refreshToken(token);
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  getMyPermissions(@CurrentUser('userId') userId: string) {
    return this.authService.getPermissionsForUser(userId);
  }

  @Post('deactivate-account')
  @UseGuards(JwtAuthGuard)
  deactivateAccount(@CurrentUser('userId') userId: string, @Req() req: Request) {
    return this.authService.deactivateAccount(userId, req);
  }

  @Get('validate-token')
  validateToken(@Req() req: Request) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    return this.authService.validateToken(token);
  }

  // TODO: forgot-password, reset-password, resend-verification -
  // straightforward additions once middleware/sendMail.js is ported to a
  // MailModule (see docs/MIGRATION_PLAN.md).
}
