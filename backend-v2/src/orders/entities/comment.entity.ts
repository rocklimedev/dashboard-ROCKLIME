import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

export enum ResourceType {
  ORDER = 'Order',
  PRODUCT = 'Product',
  CUSTOMER = 'Customer',
}

@Entity('comments')
@Index(['resourceId'])
@Index(['resourceType'])
@Index(['userId'])
@Index(['resourceId', 'resourceType', 'userId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resourceId: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  resourceType: ResourceType;

  @Column()
  userId: string;

  @Column({ type: 'varchar', length: 1000 })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}