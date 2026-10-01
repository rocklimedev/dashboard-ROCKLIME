import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  @Get('health')
  basicHealth() {
    return { status: 'OK', uptime: process.uptime() };
  }

  @Get('api/health')
  async dbHealth(@Res() res: Response) {
    try {
      await this.sequelize.authenticate();
      return res.status(HttpStatus.OK).json({
        status: 'OK',
        message: 'Server & MySQL are alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV,
      });
    } catch (err: any) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'ERROR',
        message: 'MySQL connection failed',
        error: err.message,
      });
    }
  }
}
