"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanKeywordIds = exports.buildMetaDetails = exports.normalizeKeywords = exports.getKeywordInclude = exports.COMPANY_CODE_META_ID = void 0;
exports.parseJsonSafely = parseJsonSafely;
exports.generateProductCode = generateProductCode;
exports.fetchMetaMapForProducts = fetchMetaMapForProducts;
exports.enrichProducts = enrichProducts;
const sequelize_1 = require("sequelize");
const product_entity_1 = require("../entities/product.entity");
const product_meta_entity_1 = require("../entities/product-meta.entity");
const keyword_entity_1 = require("../entities/keyword.entity");
exports.COMPANY_CODE_META_ID = 'd11da9f9-3f2e-4536-8236-9671200cca4a';
function parseJsonSafely(input, fallback, context = '') {
    if (input == null)
        return fallback;
    if (typeof input !== 'string')
        return input;
    const trimmed = input.trim();
    if (trimmed === '' || trimmed === 'null')
        return fallback;
    try {
        return JSON.parse(trimmed);
    }
    catch {
        console.warn(`Invalid JSON detected in ${context}:`, trimmed.slice(0, 200));
        return fallback;
    }
}
async function generateProductCode({ companyCode, }) {
    const brandShort = 'XX';
    const brandPrefix = 'XX';
    let baseCode = '0000';
    if (companyCode) {
        const digits = String(companyCode).trim().replace(/\D/g, '');
        if (digits.length >= 4)
            baseCode = digits.slice(-4);
        else if (digits.length > 0)
            baseCode = digits.padEnd(4, '0');
    }
    else {
        baseCode = new Date().getFullYear().toString().slice(-2) + '00';
    }
    const prefix = `E${brandShort}${brandPrefix}${baseCode}`;
    let newCode;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;
    do {
        if (attempts++ > MAX_ATTEMPTS) {
            throw new Error(`Cannot generate unique product code after ${MAX_ATTEMPTS} attempts`);
        }
        const suffix = Math.floor(1000 + Math.random() * 9000).toString();
        newCode = `${prefix}${suffix}`;
        const exists = await product_entity_1.Product.findOne({ where: { product_code: newCode } });
        if (!exists)
            break;
    } while (true);
    return newCode;
}
const getKeywordInclude = () => ({
    model: keyword_entity_1.Keyword,
    as: 'keywords',
    attributes: ['id', 'keyword'],
    through: { attributes: [] },
});
exports.getKeywordInclude = getKeywordInclude;
const normalizeKeywords = (raw = []) => (raw || []).map((k) => ({ id: k.id, keyword: k.keyword }));
exports.normalizeKeywords = normalizeKeywords;
const buildMetaDetails = (metaObj, metaMap) => Object.entries(metaObj || {}).map(([id, value]) => {
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
exports.buildMetaDetails = buildMetaDetails;
async function fetchMetaMapForProducts(products) {
    const metaIds = new Set();
    products.forEach((p) => {
        const meta = parseJsonSafely(p.meta, {});
        if (meta && typeof meta === 'object') {
            Object.keys(meta).forEach((key) => metaIds.add(key));
        }
    });
    const metaDefs = metaIds.size
        ? await product_meta_entity_1.ProductMeta.findAll({
            where: { id: { [sequelize_1.Op.in]: Array.from(metaIds) } },
            attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
        })
        : [];
    return Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));
}
async function enrichProducts(products, options = {}) {
    const list = Array.isArray(products) ? products : [products];
    const metaMap = options.metaMap || (await fetchMetaMapForProducts(list));
    const enriched = list.map((product) => {
        const raw = product.toJSON ? product.toJSON() : product;
        const metaObj = parseJsonSafely(raw.meta, {});
        const images = parseJsonSafely(raw.images, []);
        const metaDetails = (0, exports.buildMetaDetails)(metaObj, metaMap);
        const keywords = (0, exports.normalizeKeywords)(raw.keywords);
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
const cleanKeywordIds = (keywordIds = []) => {
    if (Array.isArray(keywordIds))
        return keywordIds.filter(Boolean);
    if (typeof keywordIds === 'string') {
        return keywordIds.split(',').map((id) => id.trim()).filter(Boolean);
    }
    return [];
};
exports.cleanKeywordIds = cleanKeywordIds;
//# sourceMappingURL=product.helpers.js.map