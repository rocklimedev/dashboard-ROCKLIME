import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto, UpdateQuotationDto } from './dto/quotation.dto';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('add')
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: any) {
    return this.quotationsService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.quotationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto, @CurrentUser() user: any) {
    return this.quotationsService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationsService.remove(id, user);
  }

  @Post(':id/clone')
  clone(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationsService.clone(id, user);
  }

  @Get(':id/versions/:version?')
  getVersions(@Param('id') id: string) {
    return this.quotationsService.getVersions(id);
  }

  @Post(':id/restore/:version')
  restoreVersion(@Param('id') id: string, @Param('version') version: string) {
    return this.quotationsService.restoreVersion(id, Number(version));
  }

  // NOTE: POST /export/:id/:version? (Excel export via export.service.js,
  // 301 lines) is not yet ported - see docs/MIGRATION_PLAN.md.
}
