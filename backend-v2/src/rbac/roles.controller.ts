// src/roles/roles.controller.ts
import { Controller, Post, Get, Delete, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('assign')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRole(dto);
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':roleId')
  findOne(@Param('roleId') roleId: string) {
    return this.rolesService.findOne(roleId);
  }

  @Delete(':roleId')
  remove(@Param('roleId') roleId: string) {
    return this.rolesService.remove(roleId);
  }

  @Get('recent')
  getRecentRoleToGive() {
    return this.rolesService.getRecentRoleToGive();
  }
}