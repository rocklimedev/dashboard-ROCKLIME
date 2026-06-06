import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionDto,
} from './dto/permission.dto';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() createDto: CreatePermissionDto) {
    return this.permissionService.create(createDto);
  }

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.remove(id);
  }

  @Post('assign')
  assignToRole(@Body() assignDto: AssignPermissionDto) {
    return this.permissionService.assignToRole(assignDto);
  }

  @Delete('remove')
  removeFromRole(@Body() body: { roleId: number; permissionId: number }) {
    return this.permissionService.removeFromRole(
      body.roleId,
      body.permissionId,
    );
  }
}
