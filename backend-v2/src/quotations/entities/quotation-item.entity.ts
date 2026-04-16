import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Quotation } from './quotation.entity';

@Entity('quotation_items')
@Index(['quotationId'])
export class QuotationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quotation, (q) => q.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotationId' })
  quotation: Quotation;

  @Column()
  quotationId: string;

  @Column()
  productId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  companyCode: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: ['percent', 'fixed'],
    default: 'percent',
  })
  discountType: 'percent' | 'fixed';

  @Column({ type: 'decimal', default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;

  // ─────────────────────────────
  // Floor / Room mapping
  // ─────────────────────────────

  @Column({ nullable: true }) floorId: string;
  @Column({ nullable: true }) floorName: string;

  @Column({ nullable: true }) roomId: string;
  @Column({ nullable: true }) roomName: string;

  @Column({ nullable: true }) areaId: string;
  @Column({ nullable: true }) areaName: string;
  @Column({ nullable: true }) areaValue: string;

  // ─────────────────────────────

  @Column({ nullable: true }) isOptionFor: string;

  @Column({
    type: 'enum',
    enum: ['variant', 'upgrade', 'addon'],
    nullable: true,
  })
  optionType: 'variant' | 'upgrade' | 'addon';

  @Column({ nullable: true }) groupId: string;
}