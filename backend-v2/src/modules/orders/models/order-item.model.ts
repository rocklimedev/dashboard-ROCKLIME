import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Schema({ _id: false })
export class OrderLineItem {
  @Prop({
    required: true,
  })
  productId: string;

  @Prop({
    required: true,
  })
  name: string;

  @Prop()
  imageUrl: string;

  @Prop({
    trim: true,
  })
  productCode: string;

  @Prop({
    trim: true,
  })
  companyCode: string;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
  })
  price: number;

  @Prop({
    default: 0,
  })
  discount: number;

  @Prop({
    required: true,
    enum: Object.values(DiscountType),
    default: DiscountType.PERCENT,
  })
  discountType: DiscountType;

  @Prop({
    default: 0,
  })
  tax: number;

  @Prop({
    required: true,
  })
  total: number;
}

export const OrderLineItemSchema = SchemaFactory.createForClass(OrderLineItem);

@Schema({
  timestamps: true,
  collection: 'orderitems',
})
export class OrderItem {
  @Prop({
    required: true,
    index: true,
  })
  orderId: string;

  @Prop({
    type: [OrderLineItemSchema],
    default: [],
  })
  items: OrderLineItem[];
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
