import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { User } from '../models/user.model';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team) private teamModel: typeof Team,
    @InjectModel(TeamMember) private teamMemberModel: typeof TeamMember,
    @InjectModel(User) private userModel: typeof User,
  ) {}

  async createTeam(dto: CreateTeamDto) {
    const { teamName, adminId, members = [] } = dto;

    const admin = await this.userModel.findByPk(adminId);
    if (!admin) throw new NotFoundException('Admin not found');

    const team = await this.teamModel.create({
      teamName,
      adminId,
      adminName: admin.username,
    });

    if (members.length > 0) {
      const teamMembers = members.map((m) => ({
        teamId: team.id,
        userId: m.userId,
        userName: m.userName,
        roleId: m.roleId,
        roleName: m.roleName || 'Member',
      }));

      await this.teamMemberModel.bulkCreate(teamMembers);
    }

    return team;
  }

  async getAllTeams() {
    return this.teamModel.findAll({
      include: [{ model: TeamMember, as: 'teammembers' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getTeamById(teamId: string) {
    const team = await this.teamModel.findByPk(teamId, {
      include: [{ model: TeamMember, as: 'teammembers' }],
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async updateTeam(teamId: string, dto: UpdateTeamDto) {
    const team = await this.teamModel.findByPk(teamId);
    if (!team) throw new NotFoundException('Team not found');

    let changesMade = false;

    if (dto.teamName?.trim() && dto.teamName !== team.teamName) {
      await team.update({ teamName: dto.teamName.trim() });
      changesMade = true;
    }

    if (dto.adminId && dto.adminId !== team.adminId) {
      const admin = await this.userModel.findByPk(dto.adminId);
      if (!admin) throw new BadRequestException('Invalid admin ID');

      await team.update({
        adminId: dto.adminId,
        adminName: dto.adminName || admin.username,
      });
      changesMade = true;
    }

    if (Array.isArray(dto.memberIds) && dto.memberIds.length > 0) {
      const validUsers = await this.userModel.findAll({
        where: { userId: { [Op.in]: dto.memberIds } },
      });

      if (validUsers.length === 0) {
        throw new BadRequestException('No valid members found');
      }

      // Replace all members
      await this.teamMemberModel.destroy({ where: { teamId } });

      const newMembers = validUsers.map((user) => ({
        teamId: team.id,
        userId: user.userId,
        userName: user.username,
        roleId: user.roleId,
        roleName: user.roleName || 'Member',
      }));

      await this.teamMemberModel.bulkCreate(newMembers);
      changesMade = true;
    }

    if (!changesMade) {
      return { message: 'No changes made to the team' };
    }

    const updatedTeam = await this.getTeamById(teamId);
    return { message: 'Team updated successfully', team: updatedTeam };
  }

  async deleteTeam(teamId: string) {
    const team = await this.teamModel.findByPk(teamId);
    if (!team) throw new NotFoundException('Team not found');

    await this.teamMemberModel.destroy({ where: { teamId } });
    await team.destroy();

    return { message: 'Team deleted successfully' };
  }

  // ==================== TEAM MEMBERS ====================

  async addTeamMember(teamId: string, dto: AddTeamMemberDto) {
    const team = await this.teamModel.findByPk(teamId);
    if (!team) throw new NotFoundException('Team not found');

    const member = await this.teamMemberModel.create({
      teamId,
      userId: dto.userId,
      userName: dto.userName,
      roleId: dto.roleId,
      roleName: dto.roleName || 'Member',
    });

    return member;
  }

  async removeTeamMember(memberId: string) {
    const member = await this.teamMemberModel.findByPk(memberId);
    if (!member) throw new NotFoundException('Team member not found');

    await member.destroy();
    return { message: 'Member removed successfully' };
  }

  async getTeamMembers(teamId: string) {
    return this.teamMemberModel.findAll({ where: { teamId } });
  }

  async updateTeamMember(memberId: string, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberModel.findByPk(memberId);
    if (!member) throw new NotFoundException('Team member not found');

    await member.update({
      roleId: dto.roleId,
      roleName: dto.roleName,
    });

    return member;
  }
}
