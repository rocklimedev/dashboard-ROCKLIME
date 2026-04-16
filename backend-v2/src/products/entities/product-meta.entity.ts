import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('product_metas')
export class ProductMeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  slug: string;

  @Column()
  fieldType: string;

  @Column({ nullable: true })
  unit: string;
}