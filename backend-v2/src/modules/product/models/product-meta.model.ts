import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'product_metas',
  timestamps: false,
})
export class ProductMeta extends Model<ProductMeta> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Label for the metadata field (e.g., Selling Price, MRP)',
  })
  title: string;

  @Default(null)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  slug: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Type of data (e.g., string, number, mm, inch, pcs, box, feet)',
  })
  fieldType: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Optional unit of measurement (e.g., inch, mm, pcs)',
  })
  unit: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
  })
  createdAt: Date;
}
