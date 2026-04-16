import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('vendors')
@Index(['vendorId'], { unique: true })
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Business-friendly ID (optional)
  @Column({ nullable: true })
  vendorId: string;

  @Column()
  vendorName: string;

  // FK → Brand
  @Column({ type: 'char', length: 36, nullable: true })
  brandId: string;

  // Denormalized (NOT FK)
  @Column({ nullable: true })
  brandSlug: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Brand, (brand) => brand.vendors, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @OneToMany(() => Product, (product) => product.vendor)
  products: Product[];

  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}