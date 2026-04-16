import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Quotation } from './quotation.entity';

@Entity('quotation_versions')
@Index(['quotationId', 'version'], { unique: true })
export class QuotationVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quotationId: string;

  @ManyToOne(() => Quotation, (q) => q.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotationId' })
  quotation: Quotation;

  @Column()
  version: number;

  @Column({ type: 'json' })
  quotationData: any;

  @Column({ type: 'json' })
  quotationItems: any[];

  @Column({ type: 'json', default: [] })
  floors: any[];

  @Column({ type: 'int', default: 0 })
  totalFloors: number;

  @Column()
  updatedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}