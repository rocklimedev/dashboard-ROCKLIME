import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({
    required: true,
  })
  productId: string;

  @Prop()
  name: string;

  @Prop()
  price: number;

  @Prop({
    default: 1,
  })
  quantity: number;

  @Prop({
    default: 0,
  })
  discount: number;

  @Prop({
    default: 0,
  })
  tax: number;

  @Prop()
  total: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({
  timestamps: true,
  collection: 'carts',
})
export class Cart {
  @Prop({
    required: false,
  })
  customerId?: string;

  @Prop({
    required: true,
  })
  userId: string;

  @Prop({
    type: [CartItemSchema],
    default: [],
  })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
