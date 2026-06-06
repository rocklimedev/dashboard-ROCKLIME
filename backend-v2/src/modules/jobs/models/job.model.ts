import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from '@/modules/users/entities/user.entity';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'jobs',
  timestamps: true,
})
export class Job extends Model<Job> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  type: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId: string;

  @Default({})
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  params: Record<string, any>;

  @Default(JobStatus.PENDING)
  @Column({
    type: DataType.ENUM(
      JobStatus.PENDING,
      JobStatus.PROCESSING,
      JobStatus.COMPLETED,
      JobStatus.FAILED,
      JobStatus.CANCELLED,
    ),
  })
  status: JobStatus;

  @Default({})
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  progress: Record<string, any>;

  @Default({})
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  results: Record<string, any>;

  @Default([])
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  errorLog: any[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  completedAt: Date;

  // ----------------------------------
  // Associations
  // ----------------------------------

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'SET NULL',
  })
  user: User;
}
