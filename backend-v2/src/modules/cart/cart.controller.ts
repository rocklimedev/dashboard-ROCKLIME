import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import {
  AddProductToCartDto,
  AddToCartDto,
  ClearCartDto,
  ConvertQuotationToCartDto,
  RemoveFromCartDto,
  UpdateCartDto,
} from './dto/cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  addToCart(@Body() dto: AddToCartDto) {
    return this.cartService.addToCart(dto);
  }

  @Post('add-to-cart')
  addProductToCart(@Body() dto: AddProductToCartDto) {
    return this.cartService.addProductToCart(dto);
  }

  @Get('all')
  getAllCarts() {
    return this.cartService.getAllCarts();
  }

  @Post('remove')
  removeFromCart(@Body() dto: RemoveFromCartDto) {
    return this.cartService.removeFromCart(dto);
  }

  @Post('update')
  updateCart(@Body() dto: UpdateCartDto) {
    return this.cartService.updateCart(dto);
  }

  @Post('clear')
  clearCart(@Body() dto: ClearCartDto) {
    return this.cartService.clearCart(dto);
  }

  @Post('reduce')
  reduceQuantity(@Body() dto: RemoveFromCartDto) {
    return this.cartService.reduceQuantity(dto);
  }

  @Post('convert-to-cart/:quotationId')
  convertQuotationToCart(
    @Param('quotationId') quotationId: string,
    @Body() dto: ConvertQuotationToCartDto,
  ) {
    return this.cartService.convertQuotationToCart();
  }

  // NOTE: legacy route order put a param route (`/:userId`) and a
  // differently-named param route (`/:cartId`) at the same path -
  // both resolved to getCart/getCartById on the same URL shape. Nest
  // needs one route per path, so `/cart/:userId` below does the
  // "fetch + refresh prices" version (legacy getCartById), which is the
  // richer of the two and safe to use for both cases.
  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCartWithFreshPrices(userId);
  }
}
