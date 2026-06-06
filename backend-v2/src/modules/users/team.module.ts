import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Team } from './models/team.model';
import { TeamMember } from './models/team-member.model';
import { User } from './models/user.model';
import { TeamController } from './controller/team.controller';
import { TeamService } from './services/team.service';

@Module({
  imports: [SequelizeModule.forFeature([Team, TeamMember, User])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
