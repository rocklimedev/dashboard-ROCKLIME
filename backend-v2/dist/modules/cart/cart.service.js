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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_2 = require("mongoose");
const cart_schema_1 = require("./schemas/cart.schema");
const product_entity_1 = require("../products/entities/product.entity");
const user_entity_1 = require("../users/entities/user.entity");
const PRICE_UUID = '9ba862ef-f993-4873-95ef-1fef10036aa5';
function getSellingPrice(meta) {
    let parsedMeta = meta;
    if (typeof meta === 'string') {
        try {
            parsedMeta = JSON.parse(meta);
        }
        catch {
            parsedMeta = {};
        }
    }
    if (!parsedMeta || typeof parsedMeta !== 'object')
        return null;
    let raw = parsedMeta[PRICE_UUID];
    if (!raw) {
        for (const value of Object.values(parsedMeta)) {
            if (typeof value === 'string' && /^\d{2,15}(\.\d{1,4})?$/.test(value.trim())) {
                raw = value;
                break;
            }
            if (typeof value === 'number' && value >= 1)
                return value;
        }
    }
    if (!raw)
        return null;
    const cleaned = String(raw)
        .replace(/[^\d.]/g, '')
        .replace(/\.(?=.*\.)/g, '');
    const price = parseFloat(cleaned);
    return !isNaN(price) && price >= 1 ? price : null;
}
let CartService = class CartService {
    constructor(cartModel, productModel, userModel) {
        this.cartModel = cartModel;
        this.productModel = productModel;
        this.userModel = userModel;
    }
    async addProductToCart(dto) {
        const quantity = dto.quantity ?? 1;
        const user = await this.userModel.findByPk(dto.userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const product = await this.productModel.findOne({ where: { productId: dto.productId } });
        if (!product)
            throw new common_1.NotFoundException(`Product not found: ${dto.productId}`);
        const sellingPrice = getSellingPrice(product.meta);
        if (!sellingPrice) {
            throw new common_1.BadRequestException(`Invalid or missing sellingPrice for product: ${dto.productId}`);
        }
        let cart = await this.cartModel.findOne({ userId: dto.userId });
        if (!cart)
            cart = new this.cartModel({ userId: dto.userId, items: [] });
        const existing = cart.items.find((i) => i.productId.toString() === dto.productId.toString());
        if (existing) {
            existing.quantity += quantity;
            existing.total = existing.price * existing.quantity;
        }
        else {
            cart.items.push({
                productId: dto.productId,
                name: product.name,
                price: sellingPrice,
                quantity,
                discount: 0,
                tax: Number(product.tax) || 0,
                total: sellingPrice * quantity,
            });
        }
        await cart.save();
        const message = product.quantity < quantity
            ? 'Product added to cart (even though stock is insufficient)'
            : 'Product added to cart';
        return { message, cart };
    }
    async addToCart(dto) {
        if (!dto.items?.length)
            throw new common_1.BadRequestException('items array required');
        const user = await this.userModel.findByPk(dto.userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        let cart = await this.cartModel.findOne({
            userId: dto.userId,
            customerId: dto.customerId || null,
        });
        if (!cart) {
            cart = new this.cartModel({
                userId: dto.userId,
                customerId: dto.customerId || null,
                items: [],
            });
        }
        for (const item of dto.items) {
            const qty = Number(item.quantity);
            if (!item.productId || isNaN(qty) || qty < 1) {
                throw new common_1.BadRequestException('Invalid item data');
            }
            const product = await this.productModel.findOne({
                where: { productId: item.productId },
            });
            if (!product)
                throw new common_1.NotFoundException(`Product not found: ${item.productId}`);
            const sellingPrice = getSellingPrice(product.meta);
            if (!sellingPrice) {
                throw new common_1.BadRequestException(`Invalid sellingPrice for product: ${item.productId}`);
            }
            const existing = cart.items.find((i) => i.productId.toString() === item.productId.toString());
            if (existing) {
                existing.quantity += qty;
                existing.total = existing.price * existing.quantity;
            }
            else {
                cart.items.push({
                    productId: item.productId,
                    name: product.name,
                    price: sellingPrice,
                    quantity: qty,
                    discount: Number(item.discount) || 0,
                    tax: Number(item.tax) || 0,
                    total: sellingPrice * qty,
                });
            }
        }
        await cart.save();
        return { message: 'Items added to cart successfully (stock check disabled)', cart };
    }
    async getCart(userId) {
        const cart = await this.cartModel.findOne({ userId });
        if (!cart)
            return { cart: { items: [] } };
        return { cart };
    }
    async removeFromCart(dto) {
        const cart = await this.cartModel.findOne({ userId: dto.userId });
        if (!cart)
            throw new common_1.NotFoundException('Cart not found');
        const initialLength = cart.items.length;
        cart.items = cart.items.filter((item) => item.productId.toString() !== dto.productId.toString());
        if (cart.items.length === initialLength) {
            throw new common_1.NotFoundException('Product not found in cart');
        }
        cart.updatedAt = new Date();
        await cart.save();
        return { message: 'Item removed from cart', cart };
    }
    async updateCart(dto) {
        const cart = await this.cartModel.findOne({ userId: dto.userId });
        if (!cart)
            throw new common_1.NotFoundException('Cart not found');
        const existing = cart.items.find((item) => item.productId.toString() === dto.productId.toString());
        if (!existing)
            throw new common_1.NotFoundException('Product not found in cart');
        const discount = Number(dto.discount) || 0;
        const tax = Number(dto.tax) || 0;
        existing.quantity = dto.quantity;
        existing.discount = discount;
        existing.tax = tax;
        existing.total = existing.price * dto.quantity - discount + tax;
        cart.updatedAt = new Date();
        await cart.save();
        return { message: 'Cart updated successfully', cart };
    }
    async clearCart(dto) {
        const cart = await this.cartModel.findOne({ userId: dto.userId });
        if (!cart)
            throw new common_1.NotFoundException('Cart not found');
        cart.items = [];
        cart.updatedAt = new Date();
        await cart.save();
        return { message: 'Cart cleared successfully', cart };
    }
    async getCartWithFreshPrices(userId) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const cart = await this.cartModel.findOne({ userId });
        if (!cart)
            return { cart: { items: [] } };
        const updatedItems = await Promise.all(cart.items.map(async (item) => {
            const product = await this.productModel.findByPk(item.productId);
            if (!product)
                return null;
            const sellingPrice = getSellingPrice(product.meta);
            if (sellingPrice === null)
                return null;
            return {
                productId: item.productId,
                name: product.name,
                price: sellingPrice,
                quantity: item.quantity,
                discount: item.discount || 0,
                tax: item.tax || 0,
                total: sellingPrice * item.quantity,
            };
        }));
        cart.items = updatedItems.filter((i) => i !== null);
        await cart.save();
        return { cart };
    }
    async getAllCarts() {
        const carts = await this.cartModel.find();
        return { success: true, carts };
    }
    async reduceQuantity(dto) {
        const cart = await this.cartModel.findOne({ userId: dto.userId });
        if (!cart)
            throw new common_1.NotFoundException('Cart not found');
        const existing = cart.items.find((item) => item.productId.toString() === dto.productId.toString());
        if (!existing)
            throw new common_1.NotFoundException('Item not found in cart');
        if (existing.quantity > 1) {
            existing.quantity -= 1;
            existing.total = existing.price * existing.quantity;
        }
        else {
            cart.items = cart.items.filter((item) => item.productId.toString() !== dto.productId.toString());
        }
        cart.updatedAt = new Date();
        await cart.save();
        return {
            message: existing.quantity > 0 ? 'Quantity reduced' : 'Item removed from cart',
            cart,
        };
    }
    convertQuotationToCart() {
        throw new common_1.NotImplementedException('convertQuotationToCart: wire up once QuotationsModule is migrated (see docs/MIGRATION_PLAN.md)');
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(cart_schema_1.Cart.name)),
    __param(1, (0, sequelize_1.InjectModel)(product_entity_1.Product)),
    __param(2, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object, Object])
], CartService);
//# sourceMappingURL=cart.service.js.map