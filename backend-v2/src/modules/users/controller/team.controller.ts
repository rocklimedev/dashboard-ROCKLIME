import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TeamService } from '../services/team.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
} from '../dto/team.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreateTeamDto) {
    return this.teamService.createTeam(dto);
  }

  @Get()
  async findAll() {
    return this.teamService.getAllTeams();
  }

  @Get(':teamId')
  async findOne(@Param('teamId') teamId: string) {
    return this.teamService.getTeamById(teamId);
  }

  @Put(':teamId')
  @UsePipes(ValidationPipe)
  async update(@Param('teamId') teamId: string, @Body() dto: UpdateTeamDto) {
    return this.teamService.updateTeam(teamId, dto);
  }

  @Delete(':teamId')
  async remove(@Param('teamId') teamId: string) {
    return this.teamService.deleteTeam(teamId);
  }

  // Team Members
  @Post(':teamId/members')
  @UsePipes(ValidationPipe)
  async addMember(
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamService.addTeamMember(teamId, dto);
  }

  @Delete('members/:memberId')
  async removeMember(@Param('memberId') memberId: string) {
    return this.teamService.removeTeamMember(memberId);
  }

  @Get(':teamId/members')
  async getMembers(@Param('teamId') teamId: string) {
    return this.teamService.getTeamMembers(teamId);
  }

  @Put('members/:memberId')
  @UsePipes(ValidationPipe)
  async updateMember(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.updateTeamMember(memberId, dto);
  }
}
