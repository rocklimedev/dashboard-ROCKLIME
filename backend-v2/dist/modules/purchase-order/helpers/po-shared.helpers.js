"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndCalculateItems = validateAndCalculateItems;
exports.generateDailyDocNumber = generateDailyDocNumber;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("sequelize");
const moment = require("moment");
const COMPANY_CODE_META_ID = 'd11da9f9-3f2e-4536-8236-9671200cca4a';
async function validateAndCalculateItems(productModel, items, transaction) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new common_1.BadRequestException('Items must be a non-empty array');
    }
    let total = 0;
    const prepared = [];
    for (const item of items) {
        if (!item.productId)
            throw new common_1.BadRequestException('Every item must have productId');
        const product = await productModel.findByPk(item.productId, { transaction });
        if (!product)
            throw new common_1.BadRequestException(`Product not found: ${item.productId}`);
        const qty = Number(item.quantity);
        if (qty <= 0 || isNaN(qty)) {
            throw new common_1.BadRequestException(`Invalid quantity: ${item.productId}`);
        }
        const price = Number(item.unitPrice ?? item.mrp ?? 0);
        if (price <= 0 || isNaN(price)) {
            throw new common_1.BadRequestException(`Invalid unit price: ${item.productId}`);
        }
        const lineTotal = qty * price;
        total += lineTotal;
        let imageUrl = null;
        if (product.images) {
            if (Array.isArray(product.images) && product.images.length > 0) {
                imageUrl = product.images[0];
            }
            else if (typeof product.images === 'string' && product.images.trim()) {
                try {
                    const parsed = JSON.parse(product.images);
                    if (Array.isArray(parsed) && parsed.length > 0)
                        imageUrl = parsed[0];
                }
                catch {
                }
            }
        }
        prepared.push({
            productId: item.productId,
            productName: product.name || 'Unnamed',
            companyCode: product.meta?.[COMPANY_CODE_META_ID] || null,
            productCode: product.product_code || '',
            imageUrl,
            quantity: qty,
            unitPrice: price,
            mrp: Number(item.mrp ?? price),
            discount: Number(item.discount ?? 0),
            discountType: item.discountType || 'percent',
            tax: Number(item.tax ?? 0),
            total: lineTotal,
        });
    }
    return { totalAmount: Number(total.toFixed(2)), preparedItems: prepared };
}
async function generateDailyDocNumber(model, numberField, prefixLetters, transaction) {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const datePrefix = moment().format('DDMMYY');
    const fullPrefix = `${prefixLetters}${datePrefix}`;
    const MAX_ATTEMPTS = 20;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const last = await model.findOne({
            where: {
                [numberField]: { [sequelize_1.Op.like]: `${fullPrefix}%` },
                createdAt: { [sequelize_1.Op.between]: [todayStart, todayEnd] },
            },
            attributes: [numberField],
            order: [[numberField, 'DESC']],
            limit: 1,
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        let nextSeq = 101;
        if (last) {
            const parsed = parseInt(last[numberField].slice(fullPrefix.length), 10);
            if (!isNaN(parsed))
                nextSeq = parsed + 1;
        }
        const candidate = `${fullPrefix}${nextSeq}`;
        const conflict = await model.findOne({ where: { [numberField]: candidate }, transaction });
        if (!conflict)
            return candidate;
    }
    throw new Error(`Failed to generate unique ${prefixLetters} number after ${MAX_ATTEMPTS} attempts`);
}
//# sourceMappingURL=po-shared.helpers.js.map