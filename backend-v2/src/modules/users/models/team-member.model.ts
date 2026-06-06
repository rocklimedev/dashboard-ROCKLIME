import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Team } from './team.model';
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'teammembers',
  timestamps: true,
})
export class TeamMember extends Model<TeamMember> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  })
  id: string;

  // 🔗 Foreign Key -> Team
  @ForeignKey(() => Team)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  teamId: string;

  @BelongsTo(() => Team, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  team: Team;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  userName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  roleId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  roleName: string;
}
