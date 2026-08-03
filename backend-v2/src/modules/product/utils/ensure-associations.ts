import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from '../models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
/**
 * The original controller called this at the top of nearly every handler
 * ("THIS LINE FIXES EVERYTHING ON RENDER") to work around associations not
 * being registered yet in some deploy environments. In Nest, associations
 * should be declared once, at startup — so this is invoked from
 * ProductsModule's provider bootstrap (see ProductsService / ProductQueryService
 * constructors) instead of on every request.
 *
 * It's still idempotent (guarded by the `if (!...)` checks) so calling it
 * more than once is harmless.
 */
export function ensureAssociations(): void {
  if (!Product.associations.keywords) {
    Product.belongsToMany(Keyword, {
      through: 'products_keywords',
      foreignKey: 'productId',
      otherKey: 'keywordId',
      as: 'keywords',
    });
  }

  if (!Keyword.associations.products) {
    Keyword.belongsToMany(Product, {
      through: 'products_keywords',
      foreignKey: 'keywordId',
      otherKey: 'productId',
      as: 'products',
    });
  }

  if (!Keyword.associations.categories) {
    Keyword.belongsTo(Category, {
      foreignKey: 'categoryId',
      as: 'categories',
    });
  }
}
