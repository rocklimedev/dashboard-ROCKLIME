import { Op } from 'sequelize';
import { parseJsonSafely } from './json.util';

export interface MetaDefinitionLike {
  id: string | number;
  title?: string;
  slug?: string;
  fieldType?: string;
  unit?: string;
}

export function buildMetaDetails(
  metaObj: Record<string, any>,
  metaMap: Record<string, MetaDefinitionLike>,
) {
  return Object.entries(metaObj || {}).map(([idStr, value]) => {
    const def = metaMap[idStr] || ({} as MetaDefinitionLike);
    return {
      id: idStr,
      title: def.title || 'Unknown Field',
      slug: def.slug || null,
      value: value != null ? String(value) : '',
      fieldType: def.fieldType || 'text',
      unit: def.unit || null,
    };
  });
}

export function cleanKeywords(rawKeywords: any[] = []) {
  return (rawKeywords || []).map((k) => ({
    id: k.id,
    keyword: k.keyword,
    categories: k.categories
      ? {
          categoryId: k.categories.categoryId,
          name: k.categories.name,
          slug: k.categories.slug,
        }
      : null,
  }));
}

/**
 * Applies the same normalization every read endpoint in the original
 * controller performed by hand: parse meta/images, attach metaDetails,
 * clean up keyword/category shape, and normalize variant flags.
 */
export function enrichProductJson(
  raw: any,
  metaMap: Record<string, MetaDefinitionLike> = {},
) {
  const metaObj = parseJsonSafely(
    raw.meta,
    {},
    `product ${raw.productId} meta`,
  );
  const images = parseJsonSafely(
    raw.images,
    [],
    `product ${raw.productId} images`,
  );
  const metaDetails = buildMetaDetails(metaObj, metaMap);
  const keywords = cleanKeywords(raw.keywords);

  return {
    ...raw,
    images,
    meta: metaObj,
    metaDetails,
    keywords,
    variantOptions: raw.variantOptions || {},
    variantKey: raw.variantKey || null,
    skuSuffix: raw.skuSuffix || null,
    isMaster: !!raw.isMaster,
    isVariant: !!raw.masterProductId,
  };
}

/**
 * Collects every meta-field id referenced across a list of raw products and
 * fetches their ProductMeta definitions in one query, keyed by id.
 * `productMetaModel` is passed in rather than injected so this stays a plain
 * utility usable from any service.
 */
export async function buildMetaMap(
  productMetaModel: any,
  rawProducts: any[],
): Promise<Record<string, MetaDefinitionLike>> {
  const metaIds = new Set<string>();
  rawProducts.forEach((p) => {
    const meta = parseJsonSafely(p.meta, null, `product ${p.productId} meta`);
    if (meta && typeof meta === 'object') {
      Object.keys(meta).forEach((id) => metaIds.add(id));
    }
  });

  if (metaIds.size === 0) return {};

  const defs = await productMetaModel.findAll({
    where: { id: { [Op.in]: Array.from(metaIds) } },
    attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
  });

  return Object.fromEntries(defs.map((m: any) => [m.id, m.toJSON()]));
}
