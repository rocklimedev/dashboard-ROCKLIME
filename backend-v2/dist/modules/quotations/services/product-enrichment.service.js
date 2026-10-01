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
exports.ProductEnrichmentService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const product_entity_1 = require("../../products/entities/product.entity");
const misc_helpers_1 = require("../helpers/misc.helpers");
let ProductEnrichmentService = class ProductEnrichmentService {
    constructor(productModel) {
        this.productModel = productModel;
    }
    async fetchProductMap(productIds, transaction) {
        const productMap = {};
        if (productIds.length === 0)
            return productMap;
        const dbProducts = await this.productModel.findAll({
            where: { productId: { [sequelize_2.Op.in]: productIds } },
            attributes: ['productId', 'name', 'images', 'product_code', 'meta', 'tax', 'discountType'],
            transaction,
        });
        dbProducts.forEach((p) => {
            productMap[p.productId] = {
                name: p.name?.trim() || 'Unnamed Product',
                imageUrl: (0, misc_helpers_1.extractFirstImageUrl)(p.images),
                productCode: p.product_code || null,
                companyCode: (0, misc_helpers_1.getMetaValue)(p.meta, misc_helpers_1.META_SLUGS.companyCode),
                tax: Number(p.tax) || 0,
                discountType: p.discountType || 'percent',
            };
        });
        return productMap;
    }
    async fetchProductMapForUpdate(productIds, transaction) {
        const productMap = {};
        if (productIds.length === 0)
            return productMap;
        const dbProducts = await this.productModel.findAll({
            where: { productId: { [sequelize_2.Op.in]: productIds } },
            attributes: ['productId', 'name', 'images', 'product_code', 'meta', 'tax', 'discountType'],
            transaction,
        });
        dbProducts.forEach((p) => {
            let imageUrl = null;
            if (p.images) {
                try {
                    imageUrl = (typeof p.images === 'string' ? JSON.parse(p.images) : p.images)?.[0] ?? null;
                }
                catch {
                }
            }
            productMap[p.productId] = {
                name: p.name?.trim() || 'Unnamed Product',
                imageUrl,
                productCode: p.product_code || null,
                companyCode: p.meta?.[misc_helpers_1.META_SLUGS.companyCode] || null,
                tax: Number(p.tax) || 0,
                discountType: p.discountType || 'percent',
            };
        });
        return productMap;
    }
    enrichProductsForCreate(incomingProducts, productMap) {
        return incomingProducts.map((p, index) => {
            const id = p.productId || p.id;
            const db = productMap[id] || {};
            const price = Number(p.price || 0);
            const quantity = Number(p.quantity) || 1;
            const discount = Number(p.discount || 0);
            const discountType = p.discountType || db.discountType || 'percent';
            const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor) || Boolean(p.optionType && p.optionType !== 'main');
            const optionType = p.optionType || null;
            const parentProductId = p.parentProductId || p.isOptionFor || null;
            let locations = [];
            if (Array.isArray(p.locations) && p.locations.length > 0) {
                locations = p.locations
                    .filter((loc) => loc.floorId && Number(loc.assignedQuantity) > 0)
                    .map((loc) => ({
                    floorId: loc.floorId,
                    floorName: loc.floorName || `Floor ${loc.floorId}`,
                    roomId: loc.roomId || null,
                    roomName: loc.roomName || null,
                    areaId: loc.areaId || null,
                    areaName: loc.areaName || null,
                    assignedQuantity: Number(loc.assignedQuantity),
                }));
            }
            else if (p.floorId) {
                locations = [
                    {
                        floorId: p.floorId,
                        floorName: p.floorName || null,
                        roomId: p.roomId || null,
                        roomName: p.roomName || null,
                        assignedQuantity: quantity,
                    },
                ];
            }
            return {
                productId: id,
                name: p.name || db.name || 'Unknown Product',
                imageUrl: p.imageUrl || db.imageUrl || null,
                companyCode: p.companyCode || db.companyCode || null,
                productCode: p.productCode || db.productCode || null,
                quantity,
                price: Number(price.toFixed(2)),
                discount: Number(discount.toFixed(2)),
                discountType,
                tax: Number(p.tax || 0),
                priority: Number(p.priority ?? index),
                isOption,
                optionType,
                isOptionFor: isOption ? parentProductId : null,
                parentProductId,
                groupId: p.groupId || (isOption ? null : (0, misc_helpers_1.generateGroupId)()),
                locations: locations.length > 0 ? locations : null,
                floorId: locations[0]?.floorId || null,
                floorName: locations[0]?.floorName || null,
                roomId: locations[0]?.roomId || null,
                roomName: locations[0]?.roomName || null,
            };
        });
    }
    enrichProductsForUpdate(incomingProducts, productMap) {
        return incomingProducts.map((p) => {
            const id = p.productId || p.id;
            const db = productMap[id] || {};
            const price = Number(p.price || 0);
            const totalQuantity = Number(p.quantity) || 1;
            const discount = Number(p.discount || 0);
            const discountType = p.discountType || db.discountType || 'percent';
            let locations = [];
            let validatedTotalAssignedQty = 0;
            if (Array.isArray(p.locations) && p.locations.length > 0) {
                p.locations.forEach((loc) => {
                    const assignedQty = Number(loc.assignedQuantity) || 0;
                    if (assignedQty > 0) {
                        validatedTotalAssignedQty += assignedQty;
                        locations.push({
                            floorId: loc.floorId,
                            floorName: loc.floorName || `Floor ${loc.floorId}`,
                            roomId: loc.roomId || null,
                            roomName: loc.roomName || null,
                            areaId: loc.areaId || null,
                            areaName: loc.areaName || null,
                            assignedQuantity: assignedQty,
                        });
                    }
                });
            }
            else if (p.floorId) {
                locations.push({
                    floorId: p.floorId,
                    floorName: p.floorName || null,
                    roomId: p.roomId || null,
                    roomName: p.roomName || null,
                    assignedQuantity: totalQuantity,
                });
                validatedTotalAssignedQty = totalQuantity;
            }
            if (validatedTotalAssignedQty > totalQuantity) {
                throw new Error(`Quantity overflow for product ${p.name || id}. Total assigned (${validatedTotalAssignedQty}) > available (${totalQuantity})`);
            }
            const finalLocations = locations.length === 0 ? null : locations;
            const isOption = !!p.isOptionFor;
            return {
                productId: id,
                name: p.name || db.name || 'Unknown Product',
                imageUrl: p.imageUrl || db.imageUrl || null,
                companyCode: p.companyCode || db.companyCode || null,
                productCode: p.productCode || db.productCode || null,
                quantity: totalQuantity,
                price: Number(price.toFixed(2)),
                discount: Number(discount.toFixed(2)),
                discountType,
                tax: 0,
                priority: Number(p.priority ?? 0),
                total: Number(discountType === 'percent'
                    ? price * totalQuantity * (1 - discount / 100)
                    : (price - discount) * totalQuantity),
                isOptionFor: isOption ? p.isOptionFor : null,
                optionType: p.optionType || null,
                groupId: p.groupId || (isOption ? null : (0, misc_helpers_1.generateGroupId)()),
                locations: finalLocations,
                floorId: finalLocations?.[0]?.floorId || null,
                floorName: finalLocations?.[0]?.floorName || null,
                roomId: finalLocations?.[0]?.roomId || null,
                roomName: finalLocations?.[0]?.roomName || null,
            };
        });
    }
    enrichProductsForClone(originalProducts, productMap) {
        return originalProducts.map((p) => {
            const id = p.productId || p.id;
            const db = productMap[id] || {};
            const price = Number(p.price || 0);
            const totalQuantity = Number(p.quantity) || 1;
            const discount = Number(p.discount || 0);
            const discountType = p.discountType || db.discountType || 'percent';
            let locations = null;
            let validatedTotalAssignedQty = 0;
            if (Array.isArray(p.locations) && p.locations.length > 0) {
                p.locations.forEach((loc) => {
                    const assignedQty = Number(loc.assignedQuantity) || 0;
                    if (assignedQty > 0)
                        validatedTotalAssignedQty += assignedQty;
                });
                locations = p.locations;
            }
            else if (p.floorId) {
                locations = [
                    {
                        floorId: p.floorId,
                        floorName: p.floorName || null,
                        roomId: p.roomId || null,
                        roomName: p.roomName || null,
                        assignedQuantity: totalQuantity,
                    },
                ];
            }
            if (validatedTotalAssignedQty > totalQuantity) {
                throw new Error(`Quantity overflow for product ${p.name || id}`);
            }
            if (locations && locations.length === 0)
                locations = null;
            const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor);
            return {
                productId: id,
                name: p.name || db.name || 'Unknown Product',
                imageUrl: p.imageUrl || db.imageUrl || null,
                companyCode: p.companyCode || db.companyCode || null,
                productCode: p.productCode || db.productCode || null,
                quantity: totalQuantity,
                price: Number(price.toFixed(2)),
                discount: Number(discount.toFixed(2)),
                discountType,
                tax: 0,
                priority: Number(p.priority ?? 0),
                total: Number(discountType === 'percent'
                    ? price * totalQuantity * (1 - discount / 100)
                    : (price - discount) * totalQuantity),
                isOptionFor: isOption ? p.isOptionFor || p.parentProductId : null,
                optionType: p.optionType || null,
                groupId: p.groupId || (isOption ? null : (0, misc_helpers_1.generateGroupId)()),
                locations,
                floorId: locations?.[0]?.floorId || null,
                floorName: locations?.[0]?.floorName || null,
                roomId: locations?.[0]?.roomId || null,
                roomName: locations?.[0]?.roomName || null,
            };
        });
    }
};
exports.ProductEnrichmentService = ProductEnrichmentService;
exports.ProductEnrichmentService = ProductEnrichmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(product_entity_1.Product)),
    __metadata("design:paramtypes", [Object])
], ProductEnrichmentService);
//# sourceMappingURL=product-enrichment.service.js.map