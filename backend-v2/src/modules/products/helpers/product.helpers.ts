import { Op } from 'sequelize';
import { Product } from '../entities/product.entity';
import { ProductMeta } from '../entities/product-meta.entity';
import { Keyword } from '../entities/keyword.entity';

export const COMPANY_CODE_META_ID = 'd11da9f9-3f2e-4536-8236-9671200cca4a';

/** Port of parseJsonSafely() */
export function parseJsonSafely<T = any>(
  input: unknown,
  fallback: T,
  context = '',
): T {
  if (input == null) return fallback;
  if (typeof input !== 'string') return input as T;

  const trimmed = input.trim();
  if (trimmed === '' || trimmed === 'null') return fallback;

  try {
    return JSON.parse(trimmed);
  } catch {
    console.warn(`Invalid JSON detected in ${context}:`, trimmed.slice(0, 200));
    return fallback;
  }
}

/**
 * Port of generateProductCode(). Brand short-code lookup is disabled for
 * now (falls back to "XX") until BrandsModule is migrated - swap in a real
 * Brand.findByPk lookup once that entity exists (see
 * docs/MIGRATION_PLAN.md).
 */
export async function generateProductCode({
  companyCode,
}: {
  brandId?: string;
  categoryId?: string;
  companyCode?: string;
}): Promise<string> {
  const brandShort = 'XX';
  const brandPrefix = 'XX';

  let baseCode = '0000';
  if (companyCode) {
    const digits = String(companyCode).trim().replace(/\D/g, '');
    if (digits.length >= 4) baseCode = digits.slice(-4);
    else if (digits.length > 0) baseCode = digits.padEnd(4, '0');
  } else {
    baseCode = new Date().getFullYear().toString().slice(-2) + '00';
  }

  const prefix = `E${brandShort}${brandPrefix}${baseCode}`;

  let newCode: string;
  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  do {
    if (attempts++ > MAX_ATTEMPTS) {
      throw new Error(
        `Cannot generate unique product code after ${MAX_ATTEMPTS} attempts`,
      );
    }
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    newCode = `${prefix}${suffix}`;
    const exists = await Product.findOne({ where: { product_code: newCode } });
    if (!exists) break;
    // eslint-disable-next-line no-constant-condition
  } while (true);

  return newCode;
}

/** Shared keyword include for Product queries (category include dropped
 * until Category entity exists - see docs/MIGRATION_PLAN.md). */
export const getKeywordInclude = () => ({
  model: Keyword,
  as: 'keywords',
  attributes: ['id', 'keyword'],
  through: { attributes: [] as string[] },
});

export const normalizeKeywords = (raw: any[] = []) =>
  (raw || []).map((k) => ({ id: k.id, keyword: k.keyword }));

export const buildMetaDetails = (metaObj: Record<string, any>, metaMap: Record<string, any>) =>
  Object.entries(metaObj || {}).map(([id, value]) => {
    const def = metaMap[id] || {};
    return {
      id,
      title: def.title || 'Unknown Field',
      slug: def.slug || null,
      value: value != null ? String(value) : '',
      fieldType: def.fieldType || 'text',
      unit: def.unit || null,
    };
  });

export async function fetchMetaMapForProducts(products: any[]) {
  const metaIds = new Set<string>();
  products.forEach((p) => {
    const meta = parseJsonSafely(p.meta, {});
    if (meta && typeof meta === 'object') {
      Object.keys(meta).forEach((key) => metaIds.add(key));
    }
  });

  const metaDefs = metaIds.size
    ? await ProductMeta.findAll({
        where: { id: { [Op.in]: Array.from(metaIds) } } as any,
        attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
      })
    : [];

  return Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));
}

export async function enrichProducts(products: any, options: { metaMap?: Record<string, any> } = {}) {
  const list = Array.isArray(products) ? products : [products];
  const metaMap = options.metaMap || (await fetchMetaMapForProducts(list));

  const enriched = list.map((product: any) => {
    const raw = product.toJSON ? product.toJSON() : product;
    const metaObj = parseJsonSafely(raw.meta, {});
    const images = parseJsonSafely(raw.images, []);
    const metaDetails = buildMetaDetails(metaObj, metaMap);
    const keywords = normalizeKeywords(raw.keywords);

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
      masterProductId: raw.masterProductId || raw.productId,
      quantity: Number(raw.quantity) || 0,
    };
  });

  return Array.isArray(products) ? enriched : enriched[0];
}

export const cleanKeywordIds = (keywordIds: string[] | string = []): string[] => {
  if (Array.isArray(keywordIds)) return keywordIds.filter(Boolean);
  if (typeof keywordIds === 'string') {
    return keywordIds.split(',').map((id) => id.trim()).filter(Boolean);
  }
  return [];
};
