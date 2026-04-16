import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { FieldGuidedSheet } from './field-guided-sheet.entity';

@Entity('fgs_items')
export class FgsItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FieldGuidedSheet, (fgs) => fgs.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fgsId' })
  fgs: FieldGuidedSheet;

  @Column()
  fgsId: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  companyCode: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  mrp: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: ['percent', 'fixed'],
    default: 'percent',
  })
  discountType: 'percent' | 'fixed';

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;
}