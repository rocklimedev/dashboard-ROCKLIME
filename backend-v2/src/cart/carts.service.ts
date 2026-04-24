// src/carts/carts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { getSellingPrice } from '../common/helpers/get-selling-price';
import { AddSingleProductDto } from './dto/add-single-product.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Quotation)
    private quotationRepository: Repository<Quotation>,
  ) {}

  private async findOrCreateCart(
    userId: string,
    customerId?: string,
  ): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, customerId: customerId || null },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        customerId: customerId || null,
        items: [],
      });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async addSingleProduct(dto: AddSingleProductDto) {
    const { userId, productId, quantity = 1 } = dto;

    const user = await this.userRepository.findOneBy({ id: userId }); // adjust field name if needed
    if (!user) throw new NotFoundException('User not found');

    const product = await this.productRepository.findOneBy({ productId });
    if (!product)
      throw new NotFoundException(`Product not found: ${productId}`);

    const sellingPrice = getSellingPrice(product.meta);
    if (!sellingPrice) {
      throw new BadRequestException(
        `Invalid or missing sellingPrice for product: ${productId}`,
      );
    }

    const cart = await this.findOrCreateCart(userId);

    const existing = cart.items.find((i) => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
      existing.total = existing.price * existing.quantity;
    } else {
      const newItem = this.cartItemRepository.create({
        productId,
        name: product.name,
        price: sellingPrice,
        quantity,
        discount: 0,
        tax: product.tax || 0,
        total: sellingPrice * quantity,
        cartId: cart.id,
      });
      cart.items.push(newItem);
    }

    await this.cartRepository.save(cart);

    return {
      message:
        product.quantity < quantity
          ? 'Product added to cart (even though stock is insufficient)'
          : 'Product added to cart',
      cart,
    };
  }

  async addToCart(dto: AddToCartDto) {
    const { userId, items, customerId } = dto;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const cart = await this.findOrCreateCart(userId, customerId);

    for (const item of items) {
      const { productId, quantity, discount = 0, tax = 0 } = item;
      const qty = Number(quantity);

      const product = await this.productRepository.findOneBy({ productId });
      if (!product)
        throw new NotFoundException(`Product not found: ${productId}`);

      const sellingPrice = getSellingPrice(product.meta);
      if (!sellingPrice) {
        throw new BadRequestException(
          `Invalid sellingPrice for product: ${productId}`,
        );
      }

      const existing = cart.items.find((i) => i.productId === productId);

      if (existing) {
        existing.quantity += qty;
        existing.total = existing.price * existing.quantity;
      } else {
        const newItem = this.cartItemRepository.create({
          productId,
          name: product.name,
          price: sellingPrice,
          quantity: qty,
          discount: Number(discount),
          tax: Number(tax),
          total: sellingPrice * qty,
          cartId: cart.id,
        });
        cart.items.push(newItem);
      }
    }

    await this.cartRepository.save(cart);
    return {
      message: 'Items added to cart successfully (stock check disabled)',
      cart,
    };
  }

  async getCart(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    return cart || { items: [] };
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) throw new NotFoundException('Cart not found');

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Product not found in cart');
    }

    await this.cartRepository.save(cart);
    return { message: 'Item removed from cart', cart };
  }

  async updateCartItem(dto: UpdateCartItemDto) {
    const { userId, productId, quantity, discount = 0, tax = 0 } = dto;

    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('Product not found in cart');

    item.quantity = quantity;
    item.discount = Number(discount);
    item.tax = Number(tax);
    item.total = item.price * quantity - Number(discount) + Number(tax);

    await this.cartRepository.save(cart);
    return { message: 'Cart updated successfully', cart };
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepository.findOne({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = [];
    await this.cartRepository.save(cart);
    return { message: 'Cart cleared successfully', cart };
  }

  async convertQuotationToCart(userId: string, quotationId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const quotation = await this.quotationRepository.findOne({
      where: { id: quotationId },
      relations: ['items'], // adjust according to your Quotation entity
    });

    if (!quotation) throw new NotFoundException('Quotation not found');

    const cart = await this.findOrCreateCart(userId);

    for (const qItem of quotation.items || []) {
      const product = await this.productRepository.findOneBy({
        productId: qItem.id || qItem.productId,
      });
      if (!product) continue;

      const sellingPrice = getSellingPrice(product.meta);
      if (!sellingPrice) continue;

      const existing = cart.items.find(
        (i) => i.productId === product.productId,
      );

      if (existing) {
        existing.quantity += qItem.quantity;
        existing.total = existing.price * existing.quantity;
      } else {
        const newItem = this.cartItemRepository.create({
          productId: product.productId,
          name: product.name || qItem.name,
          price: sellingPrice,
          quantity: qItem.quantity,
          discount: qItem.discount || 0,
          tax: qItem.tax || 0,
          total: sellingPrice * qItem.quantity,
          cartId: cart.id,
        });
        cart.items.push(newItem);
      }
    }

    await this.cartRepository.save(cart);
    return { message: 'Quotation converted to cart successfully', cart };
  }

  async reduceQuantity(userId: string, productId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) throw new NotFoundException('Cart not found');

    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

    const item = cart.items[itemIndex];

    if (item.quantity > 1) {
      item.quantity -= 1;
      item.total = item.price * item.quantity;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    await this.cartRepository.save(cart);
    return {
      message:
        item.quantity > 0 ? 'Quantity reduced' : 'Item removed from cart',
      cart,
    };
  }

  async getCartWithFreshPrices(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) return { items: [] };

    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.productRepository.findOneBy({
          productId: item.productId,
        });
        if (!product) return null;

        const sellingPrice = getSellingPrice(product.meta);
        if (!sellingPrice) return null;

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

    cart.items = updatedItems.filter(Boolean) as any;
    await this.cartRepository.save(cart);

    return cart;
  }

  async getAllCarts() {
    return this.cartRepository.find({ relations: ['items'] });
  }
}
