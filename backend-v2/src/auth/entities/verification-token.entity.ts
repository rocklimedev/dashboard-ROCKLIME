import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('verification_tokens')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  // ⚠️ Store HASHED token
  @Column({ type: 'varchar', length: 255 })
  token!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}