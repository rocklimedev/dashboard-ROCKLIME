"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("@nestjs/sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_3 = require("sequelize");
const product_entity_1 = require("./entities/product.entity");
const product_meta_entity_1 = require("./entities/product-meta.entity");
const inventory_history_entity_1 = require("./entities/inventory-history.entity");
const keyword_entity_1 = require("./entities/keyword.entity");
const product_keyword_entity_1 = require("./entities/product-keyword.entity");
const user_entity_1 = require("../users/entities/user.entity");
const upload_service_1 = require("../../common/upload/upload.service");
const product_helpers_1 = require("./helpers/product.helpers");
let ProductsService = class ProductsService {
    constructor(productModel, productMetaModel, inventoryHistoryModel, keywordModel, productKeywordModel, userModel, sequelize, uploadService) {
        this.productModel = productModel;
        this.productMetaModel = productMetaModel;
        this.inventoryHistoryModel = inventoryHistoryModel;
        this.keywordModel = keywordModel;
        this.productKeywordModel = productKeywordModel;
        this.userModel = userModel;
        this.sequelize = sequelize;
        this.uploadService = uploadService;
    }
    async create(dto, files = []) {
        const t = await this.sequelize.transaction();
        try {
            const metaObj = dto.meta ? (0, product_helpers_1.parseJsonSafely)(dto.meta, {}, 'meta') : {};
            const imageUrls = [];
            for (const file of files) {
                try {
                    const url = await this.uploadService.uploadToFtp(file.buffer, file.originalname, { remoteDir: '/product_images' });
                    imageUrls.push(url);
                }
                catch (err) {
                    console.error('Image upload failed for:', file.originalname, err);
                }
            }
            const isMaster = dto.isMaster === 'true' || dto.isMaster === true;
            const quantity = Number(dto.quantity) || 0;
            const productData = {
                name: dto.name?.trim() || 'Unnamed Product',
                quantity,
                images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
                meta: Object.keys(metaObj).length > 0 ? metaObj : null,
                isFeatured: dto.isFeatured === 'true' || dto.isFeatured === true,
                status: dto.status || (quantity > 0 ? 'active' : 'out_of_stock'),
                description: dto.description?.trim() || null,
                tax: dto.tax ? parseFloat(dto.tax) : null,
                alert_quantity: dto.alert_quantity
                    ? parseInt(dto.alert_quantity, 10)
                    : null,
                categoryId: dto.categoryId || null,
                brandId: dto.brandId || null,
                vendorId: dto.vendorId || null,
                brand_parentcategoriesId: dto.brand_parentcategoriesId || null,
            };
            let finalProductCode = (dto.product_code || '').trim();
            if (!finalProductCode) {
                finalProductCode = await (0, product_helpers_1.generateProductCode)({
                    brandId: dto.brandId,
                    categoryId: dto.categoryId,
                    companyCode: metaObj?.[product_helpers_1.COMPANY_CODE_META_ID] || null,
                });
            }
            let attempt = 0;
            const maxAttempts = 10;
            while (attempt < maxAttempts) {
                const duplicate = await this.productModel.findOne({
                    where: { product_code: finalProductCode },
                    transaction: t,
                });
                if (!duplicate)
                    break;
                finalProductCode = finalProductCode.replace(/-\d+$/, '') + `-${attempt + 2}`;
                attempt++;
            }
            if (attempt >= maxAttempts) {
                await t.rollback();
                throw new common_1.ConflictException('Could not generate a unique product code after multiple attempts');
            }
            productData.product_code = finalProductCode;
            let finalProduct;
            if (isMaster) {
                finalProduct = await this.productModel.create({
                    ...productData,
                    isMaster: true,
                    masterProductId: null,
                    variantOptions: null,
                    variantKey: null,
                    skuSuffix: null,
                }, { transaction: t });
            }
            else if (dto.masterProductId) {
                const master = await this.productModel.findOne({
                    where: { productId: dto.masterProductId, isMaster: true },
                    transaction: t,
                });
                if (!master) {
                    await t.rollback();
                    throw new common_1.BadRequestException('Master product not found');
                }
                const variantOpts = (0, product_helpers_1.parseJsonSafely)(dto.variantOptions, {});
                const generatedVariantKey = Object.values(variantOpts).filter(Boolean).join(' ');
                const generatedSkuSuffix = generatedVariantKey
                    ? `-${String(generatedVariantKey).toUpperCase().replace(/\s+/g, '-')}`
                    : '';
                finalProduct = await this.productModel.create({
                    ...productData,
                    name: dto.name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
                    masterProductId: master.productId,
                    isMaster: false,
                    variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
                    variantKey: generatedVariantKey || dto.variantKey || null,
                    skuSuffix: generatedSkuSuffix || dto.skuSuffix || null,
                    categoryId: dto.categoryId || master.categoryId,
                    brandId: dto.brandId || master.brandId,
                    vendorId: dto.vendorId || master.vendorId,
                    brand_parentcategoriesId: dto.brand_parentcategoriesId || master.brand_parentcategoriesId,
                    images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : master.images,
                    meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
                    description: dto.description?.trim() || master.description,
                }, { transaction: t });
            }
            else {
                finalProduct = await this.productModel.create({ ...productData, isMaster: false }, { transaction: t });
            }
            const cleanedKeywordIds = (0, product_helpers_1.cleanKeywordIds)(dto.keywordIds);
            if (cleanedKeywordIds.length > 0) {
                await finalProduct.$set('keywords', cleanedKeywordIds, { transaction: t });
            }
            await t.commit();
            const createdProduct = await this.productModel.findByPk(finalProduct.productId, {
                include: [(0, product_helpers_1.getKeywordInclude)()],
            });
            const keywords = (0, product_helpers_1.normalizeKeywords)(createdProduct.keywords);
            return {
                message: 'Product created successfully',
                product: this.serialize(createdProduct, keywords),
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.ConflictException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create product');
        }
    }
    async update(productId, dto, files = []) {
        const t = await this.sequelize.transaction();
        try {
            const product = await this.productModel.findByPk(productId, { transaction: t });
            if (!product) {
                await t.rollback();
                throw new common_1.NotFoundException('Product not found');
            }
            const metaObj = dto.meta ? (0, product_helpers_1.parseJsonSafely)(dto.meta, {}, 'meta') : {};
            let currentImages = product.images
                ? (0, product_helpers_1.parseJsonSafely)(product.images, [], 'existing images')
                : [];
            let imagesToDelete = [];
            if (dto.imagesToDelete) {
                imagesToDelete =
                    typeof dto.imagesToDelete === 'string'
                        ? (0, product_helpers_1.parseJsonSafely)(dto.imagesToDelete, [])
                        : dto.imagesToDelete;
            }
            currentImages = currentImages.filter((url) => !imagesToDelete.includes(url));
            for (const file of files) {
                try {
                    const url = await this.uploadService.uploadToFtp(file.buffer, file.originalname, {
                        remoteDir: '/product_images',
                    });
                    currentImages.push(url);
                }
                catch (err) {
                    console.error('Image upload failed:', file.originalname, err);
                }
            }
            const isMaster = dto.isMaster === 'true' || dto.isMaster === true;
            const updateData = {
                name: dto.name?.trim() || product.name,
                product_code: dto.product_code?.trim() || product.product_code,
                quantity: dto.quantity !== undefined ? Number(dto.quantity) : product.quantity,
                images: JSON.stringify(currentImages),
                meta: Object.keys(metaObj).length > 0 ? metaObj : null,
                isFeatured: dto.isFeatured === 'true' || dto.isFeatured === true || product.isFeatured,
                status: dto.status || product.status,
                description: dto.description?.trim() || product.description,
                tax: dto.tax !== undefined ? parseFloat(dto.tax) : product.tax,
                alert_quantity: dto.alert_quantity !== undefined
                    ? parseInt(dto.alert_quantity, 10)
                    : product.alert_quantity,
                categoryId: dto.categoryId || product.categoryId,
                brandId: dto.brandId || product.brandId,
                vendorId: dto.vendorId || product.vendorId,
                brand_parentcategoriesId: dto.brand_parentcategoriesId || product.brand_parentcategoriesId,
            };
            if (isMaster && !product.isMaster) {
                const hasVariants = await this.productModel.count({
                    where: { masterProductId: product.productId },
                    transaction: t,
                });
                if (hasVariants > 0) {
                    await t.rollback();
                    throw new common_1.BadRequestException('Cannot convert to master product: it already has variants');
                }
                Object.assign(updateData, {
                    isMaster: true,
                    masterProductId: null,
                    variantOptions: null,
                    variantKey: null,
                    skuSuffix: null,
                });
            }
            else if (!isMaster &&
                dto.masterProductId &&
                dto.masterProductId !== product.masterProductId) {
                const master = await this.productModel.findOne({
                    where: { productId: dto.masterProductId, isMaster: true },
                    transaction: t,
                });
                if (!master) {
                    await t.rollback();
                    throw new common_1.BadRequestException('Master product not found');
                }
                const variantOpts = (0, product_helpers_1.parseJsonSafely)(dto.variantOptions, {});
                const generatedVariantKey = Object.values(variantOpts).filter(Boolean).join(' ');
                const generatedSkuSuffix = generatedVariantKey
                    ? `-${String(generatedVariantKey).toUpperCase().replace(/\s+/g, '-')}`
                    : '';
                Object.assign(updateData, {
                    masterProductId: master.productId,
                    isMaster: false,
                    variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
                    variantKey: generatedVariantKey || dto.variantKey || null,
                    skuSuffix: generatedSkuSuffix || dto.skuSuffix || null,
                    name: dto.name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
                    categoryId: dto.categoryId || master.categoryId,
                    brandId: dto.brandId || master.brandId,
                });
            }
            else {
                updateData.isMaster = isMaster;
                if (!isMaster) {
                    const finalKey = dto.variantKey ||
                        (dto.variantOptions
                            ? Object.values((0, product_helpers_1.parseJsonSafely)(dto.variantOptions, {})).filter(Boolean).join(' ')
                            : product.variantKey);
                    const finalSuffix = finalKey
                        ? `-${String(finalKey).toUpperCase().replace(/\s+/g, '-')}`
                        : product.skuSuffix;
                    updateData.variantKey = finalKey;
                    updateData.skuSuffix = finalSuffix;
                    updateData.variantOptions = dto.variantOptions
                        ? (0, product_helpers_1.parseJsonSafely)(dto.variantOptions, {})
                        : product.variantOptions;
                }
                else {
                    updateData.variantOptions = null;
                    updateData.variantKey = null;
                    updateData.skuSuffix = null;
                    updateData.masterProductId = null;
                }
            }
            await product.update(updateData, { transaction: t });
            const cleanedKeywordIds = (0, product_helpers_1.cleanKeywordIds)(dto.keywordIds);
            await product.$set('keywords', cleanedKeywordIds, { transaction: t });
            const updated = await this.productModel.findByPk(productId, {
                transaction: t,
                include: [(0, product_helpers_1.getKeywordInclude)()],
            });
            await t.commit();
            const keywords = (0, product_helpers_1.normalizeKeywords)(updated.keywords);
            return {
                message: 'Product updated successfully',
                product: this.serialize(updated, keywords),
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to update product');
        }
    }
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const offset = (page - 1) * limit;
        const searchTerm = query.search?.trim();
        const tab = query.tab || 'all';
        const lowStockThreshold = parseInt(query.lowStockThreshold) || 10;
        const where = {};
        if (searchTerm) {
            const pattern = `%${searchTerm.toLowerCase()}%`;
            where[sequelize_3.Op.or] = [
                this.sequelize.where(this.sequelize.fn('LOWER', this.sequelize.col('Product.name')), sequelize_3.Op.like, pattern),
                { product_code: { [sequelize_3.Op.like]: pattern } },
            ];
        }
        if (tab === 'in-stock')
            where.quantity = { [sequelize_3.Op.gt]: 0 };
        else if (tab === 'out-of-stock')
            where.quantity = 0;
        else if (tab === 'low-stock')
            where.quantity = { [sequelize_3.Op.gt]: 0, [sequelize_3.Op.lte]: lowStockThreshold };
        const { count: total, rows: products } = await this.productModel.findAndCountAll({
            where,
            order: [
                ['updatedAt', 'DESC'],
                ['name', 'ASC'],
            ],
            offset,
            limit,
            distinct: true,
            include: [(0, product_helpers_1.getKeywordInclude)()],
        });
        if (total === 0) {
            return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
        }
        const data = await (0, product_helpers_1.enrichProducts)(products);
        return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(productId) {
        const product = await this.productModel.findByPk(productId, {
            include: [(0, product_helpers_1.getKeywordInclude)()],
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const raw = product.toJSON();
        const images = (0, product_helpers_1.parseJsonSafely)(raw.images, []);
        const metaObj = (0, product_helpers_1.parseJsonSafely)(raw.meta, {});
        const metaIds = Object.keys(metaObj);
        const metaDefs = metaIds.length
            ? await this.productMetaModel.findAll({
                where: { id: { [sequelize_3.Op.in]: metaIds } },
                attributes: ['id', 'title', 'slug', 'fieldType', 'unit'],
            })
            : [];
        const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m]));
        const metaDetails = metaIds.map((id) => ({
            id,
            title: metaMap[id]?.title ?? 'Unknown',
            slug: metaMap[id]?.slug ?? null,
            value: String(metaObj[id] ?? ''),
            fieldType: metaMap[id]?.fieldType ?? 'text',
            unit: metaMap[id]?.unit ?? null,
        }));
        return {
            ...raw,
            images,
            meta: metaObj,
            metaDetails,
            keywords: (0, product_helpers_1.normalizeKeywords)(raw.keywords),
            isMaster: !!raw.isMaster,
            isVariant: !!raw.masterProductId,
        };
    }
    async findByIds(productIds) {
        const products = await this.productModel.findAll({
            where: { productId: { [sequelize_3.Op.in]: productIds } },
            order: [['name', 'ASC']],
            include: [(0, product_helpers_1.getKeywordInclude)()],
        });
        const foundIds = products.map((p) => p.productId);
        const missing = productIds.filter((id) => !foundIds.includes(id));
        if (missing.length > 0) {
            throw new common_1.NotFoundException(`Products not found for IDs: ${missing.join(', ')}`);
        }
        const data = await (0, product_helpers_1.enrichProducts)(products);
        return { data, pagination: { total: data.length, page: 1, limit: data.length, totalPages: 1 } };
    }
    findByCategory(categoryId) {
        return this.productModel.findAll({ where: { categoryId } });
    }
    findByBrand(brandId) {
        return this.productModel.findAll({ where: { brandId } });
    }
    async remove(productId) {
        const product = await this.productModel.findByPk(productId);
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        await product.destroy();
        return { message: 'Product deleted successfully' };
    }
    async count() {
        const total = await this.productModel.count();
        return { success: true, totalProducts: total };
    }
    async checkCode(code) {
        if (!code)
            throw new common_1.BadRequestException('Code is required');
        const existing = await this.productModel.findOne({
            where: { product_code: code.trim() },
            attributes: ['product_code'],
        });
        return { exists: !!existing };
    }
    async updateFeatured(productId, dto) {
        const product = await this.productModel.findOne({ where: { productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        product.isFeatured = dto.isFeatured;
        await product.save();
        return { message: 'Product featured status updated successfully', product };
    }
    async addStock(productId, dto) {
        if (!dto.quantity || dto.quantity <= 0) {
            throw new common_1.BadRequestException('Valid quantity is required');
        }
        const qty = Number(dto.quantity);
        const result = await this.sequelize.transaction(async (t) => {
            const product = await this.productModel.findByPk(productId, {
                lock: t.LOCK.UPDATE,
                transaction: t,
            });
            if (!product)
                throw new common_1.NotFoundException('Product not found');
            const newQuantity = product.quantity + qty;
            await product.update({ quantity: newQuantity }, { transaction: t });
            let username = 'unknown';
            if (dto.userId) {
                const user = await this.userModel.findByPk(dto.userId, {
                    attributes: ['username'],
                    transaction: t,
                });
                if (user)
                    username = user.username;
            }
            const finalMessage = dto.message?.trim() ||
                `Stock added by ${username}${dto.orderNo ? ` (Order #${dto.orderNo})` : ''}`;
            const history = await this.inventoryHistoryModel.create({
                productId,
                change: qty,
                quantityAfter: newQuantity,
                action: 'add-stock',
                orderNo: dto.orderNo || null,
                userId: dto.userId || null,
                message: finalMessage,
            }, { transaction: t });
            return { product, history };
        });
        return {
            message: 'Stock added successfully',
            product: result.product,
            inventoryHistory: this.serializeHistory(result.history),
        };
    }
    async removeStock(productId, dto) {
        if (!dto.quantity || dto.quantity <= 0) {
            throw new common_1.BadRequestException('Valid quantity is required');
        }
        const qty = Number(dto.quantity);
        const result = await this.sequelize.transaction(async (t) => {
            const product = await this.productModel.findByPk(productId, {
                lock: t.LOCK.UPDATE,
                transaction: t,
            });
            if (!product)
                throw new common_1.NotFoundException('Product not found');
            if (product.quantity < qty)
                throw new common_1.BadRequestException('Insufficient stock');
            const newQuantity = product.quantity - qty;
            await product.update({ quantity: newQuantity }, { transaction: t });
            let username = 'unknown';
            if (dto.userId) {
                const user = await this.userModel.findByPk(dto.userId, {
                    attributes: ['username'],
                    transaction: t,
                });
                if (user)
                    username = user.username;
            }
            const finalMessage = dto.message?.trim() ||
                `Stock removed by ${username}${dto.orderNo ? ` (Order #${dto.orderNo})` : ''}`;
            const history = await this.inventoryHistoryModel.create({
                productId,
                change: -qty,
                quantityAfter: newQuantity,
                action: 'remove-stock',
                orderNo: dto.orderNo || null,
                userId: dto.userId || null,
                message: finalMessage,
            }, { transaction: t });
            return { product, history };
        });
        return {
            message: 'Stock removed successfully',
            product: result.product,
            inventoryHistory: this.serializeHistory(result.history),
        };
    }
    async getHistory(productId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const offset = (page - 1) * limit;
        const { count, rows } = await this.inventoryHistoryModel.findAndCountAll({
            where: { productId },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });
        return {
            message: 'Inventory history retrieved successfully',
            total: count,
            page,
            pages: Math.ceil(count / limit),
            history: rows.map((h) => this.serializeHistory(h)),
        };
    }
    async addKeywords(productId, keywordIds) {
        const t = await this.sequelize.transaction();
        try {
            const product = await this.productModel.findByPk(productId, { transaction: t });
            if (!product) {
                await t.rollback();
                throw new common_1.NotFoundException('Product not found');
            }
            const keywords = await this.keywordModel.findAll({
                where: { id: keywordIds },
                transaction: t,
            });
            if (keywords.length !== keywordIds.length) {
                await t.rollback();
                throw new common_1.BadRequestException('One or more keyword IDs are invalid');
            }
            await this.productKeywordModel.bulkCreate(keywordIds.map((keywordId) => ({ productId, keywordId })), { ignoreDuplicates: true, transaction: t });
            await t.commit();
            return { message: 'Keywords added successfully', keywords };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async removeKeyword(productId, keywordId) {
        const deleted = await this.productKeywordModel.destroy({ where: { productId, keywordId } });
        if (deleted === 0) {
            throw new common_1.NotFoundException('Keyword not associated with this product');
        }
        return { message: 'Keyword removed successfully' };
    }
    async removeAllKeywords(productId) {
        await this.productKeywordModel.destroy({ where: { productId } });
        return { message: 'All keywords removed' };
    }
    async replaceKeywords(productId, keywordIds) {
        const t = await this.sequelize.transaction();
        try {
            const cleanIds = (0, product_helpers_1.cleanKeywordIds)(keywordIds);
            const product = await this.productModel.findByPk(productId, { transaction: t });
            if (!product) {
                await t.rollback();
                throw new common_1.NotFoundException('Product not found');
            }
            await product.$set('keywords', cleanIds, { transaction: t });
            await t.commit();
            const updated = await this.productModel.findByPk(productId, {
                include: [(0, product_helpers_1.getKeywordInclude)()],
            });
            return { message: 'Keywords updated successfully', keywords: updated.keywords || [] };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Failed to update keywords');
        }
    }
    searchProducts() {
        throw new common_1.NotImplementedException('searchProducts: port from product.service.js line ~1491');
    }
    getLowStockProducts() {
        throw new common_1.NotImplementedException('getLowStockProducts: port from product.service.js line ~1258/1363');
    }
    getTopSellingProducts() {
        throw new common_1.NotImplementedException('getTopSellingProducts: port from product.service.js line ~2162 (requires Order model)');
    }
    bulkImportProducts() {
        throw new common_1.NotImplementedException('bulkImportProducts: port from product.service.js line ~2583 + workers/bulkImportWorker.js');
    }
    bulkInventoryUpdate() {
        throw new common_1.NotImplementedException('bulkInventoryUpdate: port from product.service.js line ~2636');
    }
    getAllProductCodesBrandWise() {
        throw new common_1.NotImplementedException('getAllProductCodesBrandWise: port from product.service.js line ~1767 (requires Brand model)');
    }
    getAllProductCodes() {
        throw new common_1.NotImplementedException('getAllProductCodes: port from product.service.js line ~1644');
    }
    serialize(product, keywords) {
        return {
            ...product.toJSON(),
            images: product.images ? JSON.parse(product.images) : [],
            meta: product.meta || {},
            keywords,
            variantOptions: product.variantOptions || {},
            variantKey: product.variantKey || null,
            skuSuffix: product.skuSuffix || null,
            isMaster: !!product.isMaster,
            isVariant: !!product.masterProductId,
        };
    }
    serializeHistory(h) {
        return {
            id: h.id,
            action: h.action,
            change: h.change,
            quantityAfter: h.quantityAfter,
            timestamp: h.createdAt,
            orderNo: h.orderNo,
            userId: h.userId,
            message: h.message,
        };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(product_entity_1.Product)),
    __param(1, (0, sequelize_1.InjectModel)(product_meta_entity_1.ProductMeta)),
    __param(2, (0, sequelize_1.InjectModel)(inventory_history_entity_1.InventoryHistory)),
    __param(3, (0, sequelize_1.InjectModel)(keyword_entity_1.Keyword)),
    __param(4, (0, sequelize_1.InjectModel)(product_keyword_entity_1.ProductKeyword)),
    __param(5, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __param(6, (0, sequelize_2.InjectConnection)()),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, sequelize_typescript_1.Sequelize,
        upload_service_1.UploadService])
], ProductsService);
//# sourceMappingURL=products.service.js.map