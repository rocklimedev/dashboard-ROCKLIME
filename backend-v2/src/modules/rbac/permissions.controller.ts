import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/role.dto';

@Controller('permission')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':permissionId')
  findOne(@Param('permissionId') permissionId: string) {
    return this.permissionsService.findOne(permissionId);
  }

  @Put(':permissionId')
  update(
    @Param('permissionId') permissionId: string,
    @Body() dto: Partial<CreatePermissionDto>,
  ) {
    return this.permissionsService.update(permissionId, dto);
  }

  @Delete(':permissionId')
  remove(@Param('permissionId') permissionId: string) {
    return this.permissionsService.remove(permissionId);
  }
}
