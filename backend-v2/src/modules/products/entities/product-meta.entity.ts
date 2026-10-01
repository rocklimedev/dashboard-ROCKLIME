import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'product_metas', timestamps: false })
export class ProductMeta extends Model<ProductMeta> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, allowNull: true })
  slug: string;

  @Column({ type: DataType.STRING, allowNull: false })
  fieldType: string;

  @Column({ type: DataType.STRING, allowNull: true })
  unit: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  createdAt: Date;
}
