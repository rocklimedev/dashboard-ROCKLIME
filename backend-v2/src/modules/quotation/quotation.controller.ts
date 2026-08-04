import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Sequelize } from 'sequelize-typescript';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { QuotationCrudService } from './services/quotation.service';
import { QuotationExportService } from './services/quotation-export.service';
import { QuotationVersionService } from './services/quotation-version.service';
import { NotificationService } from '../notifications/notification.service'; // adjust to your actual service

@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly crudService: QuotationCrudService,
    private readonly exportService: QuotationExportService,
    private readonly versionService: QuotationVersionService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  create(@Body() dto: CreateQuotationDto, @Req() req: any) {
    return this.crudService.create(dto, req.user);
  }

  @Get()
  findAll(@Query() query: QueryQuotationDto) {
    return this.crudService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.crudService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @Req() req: any,
  ) {
    return this.crudService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.crudService.remove(id, req.user);
  }

  @Post(':id/clone')
  clone(@Param('id') id: string, @Req() req: any) {
    return this.crudService.clone(id, req.user);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.versionService.listVersions(id);
  }

  @Post(':id/versions/:version/restore')
  async restoreVersion(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
    @Req() req: any,
  ) {
    const t = await this.sequelize.transaction();
    try {
      await this.versionService.restoreVersion(id, version, t);
      await t.commit();
    } catch (error) {
      await t.rollback().catch(() => undefined);
      throw error;
    }

    await this.notificationService.send({
      userId: req.user.userId,
      title: 'Quotation Restored',
      message: `Quotation "${id}" restored to version ${version}.`,
    });

    return { message: `Quotation restored to version ${version}` };
  }

  @Get(':id/export/:version?')
  async exportQuotation(
    @Param('id') id: string,
    @Param('version') version: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.exportService.export(
      id,
      version ? Number(version) : undefined,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  }
}
