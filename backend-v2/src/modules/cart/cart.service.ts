import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { InjectModel as InjectSequelizeModel } from '@nestjs/sequelize';
import { Model as MongoModel } from 'mongoose';
import { Cart } from './schemas/cart.schema';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import {
  AddProductToCartDto,
  AddToCartDto,
  ClearCartDto,
  RemoveFromCartDto,
  UpdateCartDto,
} from './dto/cart.dto';

const PRICE_UUID = '9ba862ef-f993-4873-95ef-1fef10036aa5';

/** Port of cart.controller.js getSellingPrice() */
function getSellingPrice(meta: unknown): number | null {
  let parsedMeta: any = meta;
  if (typeof meta === 'string') {
    try {
      parsedMeta = JSON.parse(meta);
    } catch {
      parsedMeta = {};
    }
  }
  if (!parsedMeta || typeof parsedMeta !== 'object') return null;

  let raw = parsedMeta[PRICE_UUID];
  if (!raw) {
    for (const value of Object.values(parsedMeta)) {
      if (typeof value === 'string' && /^\d{2,15}(\.\d{1,4})?$/.test(value.trim())) {
        raw = value;
        break;
      }
      if (typeof value === 'number' && value >= 1) return value;
    }
  }
  if (!raw) return null;

  const cleaned = String(raw)
    .replace(/[^\d.]/g, '')
    .replace(/\.(?=.*\.)/g, '');
  const price = parseFloat(cleaned);
  return !isNaN(price) && price >= 1 ? price : null;
}

@Injectable()
export class CartService {
  constructor(
    @InjectMongoModel(Cart.name) private readonly cartModel: MongoModel<Cart>,
    @InjectSequelizeModel(Product) private readonly productModel: typeof Product,
    @InjectSequelizeModel(User) private readonly userModel: typeof User,
  ) {}

  async addProductToCart(dto: AddProductToCartDto) {
    const quantity = dto.quantity ?? 1;
    const user = await this.userModel.findByPk(dto.userId);
    if (!user) throw new NotFoundException('User not found');

    const product = await this.productModel.findOne({ where: { productId: dto.productId } });
    if (!product) throw new NotFoundException(`Product not found: ${dto.productId}`);

    const sellingPrice = getSellingPrice(product.meta);
    if (!sellingPrice) {
      throw new BadRequestException(
        `Invalid or missing sellingPrice for product: ${dto.productId}`,
      );
    }

    let cart = await this.cartModel.findOne({ userId: dto.userId });
    if (!cart) cart = new this.cartModel({ userId: dto.userId, items: [] });

    const existing = cart.items.find((i) => i.productId.toString() === dto.productId.toString());
    if (existing) {
      existing.quantity += quantity;
      existing.total = existing.price * existing.quantity;
    } else {
      cart.items.push({
        productId: dto.productId,
        name: product.name,
        price: sellingPrice,
        quantity,
        discount: 0,
        tax: Number(product.tax) || 0,
        total: sellingPrice * quantity,
      } as any);
    }

    await cart.save();

    const message =
      product.quantity < quantity
        ? 'Product added to cart (even though stock is insufficient)'
        : 'Product added to cart';

    return { message, cart };
  }

  async addToCart(dto: AddToCartDto) {
    if (!dto.items?.length) throw new BadRequestException('items array required');

    const user = await this.userModel.findByPk(dto.userId);
    if (!user) throw new NotFoundException('User not found');

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
        throw new BadRequestException('Invalid item data');
      }

      const product = await this.productModel.findOne({
        where: { productId: item.productId },
      });
      if (!product) throw new NotFoundException(`Product not found: ${item.productId}`);

      const sellingPrice = getSellingPrice(product.meta);
      if (!sellingPrice) {
        throw new BadRequestException(`Invalid sellingPrice for product: ${item.productId}`);
      }

      const existing = cart.items.find(
        (i) => i.productId.toString() === item.productId.toString(),
      );
      if (existing) {
        existing.quantity += qty;
        existing.total = existing.price * existing.quantity;
      } else {
        cart.items.push({
          productId: item.productId,
          name: product.name,
          price: sellingPrice,
          quantity: qty,
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 0,
          total: sellingPrice * qty,
        } as any);
      }
    }

    await cart.save();
    return { message: 'Items added to cart successfully (stock check disabled)', cart };
  }

  async getCart(userId: string) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) return { cart: { items: [] } };
    return { cart };
  }

  async removeFromCart(dto: RemoveFromCartDto) {
    const cart = await this.cartModel.findOne({ userId: dto.userId });
    if (!cart) throw new NotFoundException('Cart not found');

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== dto.productId.toString(),
    ) as any;

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Product not found in cart');
    }

    (cart as any).updatedAt = new Date();
    await cart.save();
    return { message: 'Item removed from cart', cart };
  }

  async updateCart(dto: UpdateCartDto) {
    const cart = await this.cartModel.findOne({ userId: dto.userId });
    if (!cart) throw new NotFoundException('Cart not found');

    const existing = cart.items.find(
      (item) => item.productId.toString() === dto.productId.toString(),
    );
    if (!existing) throw new NotFoundException('Product not found in cart');

    const discount = Number(dto.discount) || 0;
    const tax = Number(dto.tax) || 0;

    existing.quantity = dto.quantity;
    existing.discount = discount;
    existing.tax = tax;
    existing.total = existing.price * dto.quantity - discount + tax;

    (cart as any).updatedAt = new Date();
    await cart.save();
    return { message: 'Cart updated successfully', cart };
  }

  async clearCart(dto: ClearCartDto) {
    const cart = await this.cartModel.findOne({ userId: dto.userId });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = [];
    (cart as any).updatedAt = new Date();
    await cart.save();
    return { message: 'Cart cleared successfully', cart };
  }

  async getCartWithFreshPrices(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const cart = await this.cartModel.findOne({ userId });
    if (!cart) return { cart: { items: [] } };

    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.productModel.findByPk(item.productId);
        if (!product) return null;

        const sellingPrice = getSellingPrice(product.meta);
        if (sellingPrice === null) return null;

        return {
          productId: item.productId,
          name: product.name,
          price: sellingPrice,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: sellingPrice * item.quantity,
        };
      }),
    );

    cart.items = updatedItems.filter((i) => i !== null) as any;
    await cart.save();
    return { cart };
  }

  async getAllCarts() {
    const carts = await this.cartModel.find();
    return { success: true, carts };
  }

  async reduceQuantity(dto: RemoveFromCartDto) {
    const cart = await this.cartModel.findOne({ userId: dto.userId });
    if (!cart) throw new NotFoundException('Cart not found');

    const existing = cart.items.find(
      (item) => item.productId.toString() === dto.productId.toString(),
    );
    if (!existing) throw new NotFoundException('Item not found in cart');

    if (existing.quantity > 1) {
      existing.quantity -= 1;
      existing.total = existing.price * existing.quantity;
    } else {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== dto.productId.toString(),
      ) as any;
    }

    (cart as any).updatedAt = new Date();
    await cart.save();

    return {
      message: existing.quantity > 0 ? 'Quantity reduced' : 'Item removed from cart',
      cart,
    };
  }

  /**
   * Port of convertQuotationToCart() from cart.controller.js - requires
   * QuotationsModule (not yet migrated). Wire this up once Quotation is
   * available: fetch quotation.products (JSON array), loop through,
   * getSellingPrice() each, and push/merge into the cart exactly like
   * addToCart() above.
   */
  convertQuotationToCart(): never {
    throw new NotImplementedException(
      'convertQuotationToCart: wire up once QuotationsModule is migrated (see docs/MIGRATION_PLAN.md)',
    );
  }
}
