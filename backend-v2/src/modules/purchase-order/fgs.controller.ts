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
import { FgsService } from './fgs.service';
import { CreateFgsDto, UpdateFgsDto, UpdateFgsStatusDto } from './dto/purchase-order.dto';

@Controller('fgs')
@UseGuards(JwtAuthGuard)
export class FgsController {
  constructor(private readonly fgsService: FgsService) {}

  @Post()
  create(@Body() dto: CreateFgsDto, @CurrentUser('userId') userId: string) {
    return this.fgsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.fgsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fgsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFgsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.fgsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.fgsService.remove(id, userId);
  }

  @Post(':id/convert')
  convertToPo(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.fgsService.convertToPo(id, userId);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFgsStatusDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.fgsService.updateStatus(id, dto, userId);
  }
}
