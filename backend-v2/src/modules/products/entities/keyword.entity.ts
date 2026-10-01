import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from "sequelize-typescript";
import { Product } from "./product.entity";
import { ProductKeyword } from "./product-keyword.entity";

/**
 * Minimal port of modules/brands/models/keyword.model.js - only the columns
 * needed by the Products module's keyword-tagging endpoints. `categoryId`
 * is kept as a plain column (no @BelongsTo yet) until BrandsModule /
 * Category are migrated - see docs/MIGRATION_PLAN.md.
 */
@Table({ tableName: "keywords", timestamps: true })
export class Keyword extends Model<Keyword> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  keyword: string;

  @Column({ type: DataType.STRING, allowNull: true })
  type: string;

  @Column({ type: DataType.UUID, allowNull: true })
  categoryId: string;

  @BelongsToMany(() => Product, () => ProductKeyword)
  products: Product[];
}
