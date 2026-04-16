// src/carts/carts.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddSingleProductDto } from './dto/add-single-product.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post('add-single')
  addSingleProduct(@Body() dto: AddSingleProductDto) {
    return this.cartsService.addSingleProduct(dto);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  addToCart(@Body() dto: AddToCartDto) {
    return this.cartsService.addToCart(dto);
  }

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartsService.getCart(userId);
  }

  @Get(':userId/fresh')
  getCartById(@Param('userId') userId: string) {
    return this.cartsService.getCartWithFreshPrices(userId);
  }

  @Delete('item')
  removeFromCart(@Body('userId') userId: string, @Body('productId') productId: string) {
    return this.cartsService.removeFromCart(userId, productId);
  }

  @Put('item')
  updateCartItem(@Body() dto: UpdateCartItemDto) {
    return this.cartsService.updateCartItem(dto);
  }

  @Delete('clear')
  clearCart(@Body('userId') userId: string) {
    return this.cartsService.clearCart(userId);
  }

  @Post('convert-quotation')
  convertQuotationToCart(
    @Body('userId') userId: string,
    @Body('quotationId') quotationId: string,
  ) {
    return this.cartsService.convertQuotationToCart(userId, quotationId);
  }

  @Post('reduce')
  reduceQuantity(@Body('userId') userId: string, @Body('productId') productId: string) {
    return this.cartsService.reduceQuantity(userId, productId);
  }

  @Get()
  getAllCarts() {
    return this.cartsService.getAllCarts();
  }
}