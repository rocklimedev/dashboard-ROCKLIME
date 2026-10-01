import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class OrderItemLine {
  @Prop() productId: string;
  @Prop() name: string;
  @Prop() imageUrl: string;
  @Prop({ trim: true }) productCode: string;
  @Prop() quantity: number;
  @Prop({ default: 0 }) dispatchedQuantity: number;
  @Prop() price: number;
  @Prop({ default: 0 }) discount: number;
  @Prop({ enum: ['percent', 'fixed'], default: 'percent' }) discountType: string;
  @Prop({ default: 0 }) tax: number;
  @Prop() total: number;
}
const OrderItemLineSchema = SchemaFactory.createForClass(OrderItemLine);

@Schema()
export class OrderItem extends Document {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ type: [OrderItemLineSchema], default: [] })
  items: OrderItemLine[];
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
