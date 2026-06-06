import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { v4 as uuidv4 } from 'uuid';
import { Order } from './order.model';
import { TeamMember } from './team-member.model';
import { User } from './user.model';

@Table({
  tableName: 'teams',
  timestamps: true,
})
export class Team extends Model<Team> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  teamName: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  adminId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  adminName: string;

  // ---------------------------------------
  // 1:M -> Orders
  // ---------------------------------------
  @HasMany(() => Order, {
    foreignKey: 'assignedTeamId',
  })
  teamOrders: Order[];

  // ---------------------------------------
  // M:N -> Users through TeamMember
  // ---------------------------------------
  @BelongsToMany(() => User, () => TeamMember)
  members: User[];
}
