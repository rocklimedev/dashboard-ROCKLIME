import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class PoLineItem {
  @Prop({ required: true }) productId: string;
  @Prop({ required: true, trim: true }) productName: string;
  @Prop({ trim: true }) productCode: string;
  @Prop({ trim: true }) companyCode: string;
  @Prop({ trim: true, default: null }) imageUrl: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) unitPrice: number;
  @Prop({ min: 0 }) mrp: number;
  @Prop({ default: 0, min: 0 }) discount: number;
  @Prop({ enum: ['percent', 'fixed'], default: 'percent' }) discountType: string;
  @Prop({ default: 0, min: 0 }) tax: number;
  @Prop({ required: true, min: 0 }) total: number;
}
const PoLineItemSchema = SchemaFactory.createForClass(PoLineItem);

@Schema({ timestamps: true, collection: 'fgs_items' })
export class FgsItem extends Document {
  @Prop({ required: true, index: true })
  fgsId: string;

  @Prop({ required: true, index: true })
  fgsNumber: string;

  @Prop({ required: true })
  vendorId: string;

  @Prop({ type: [PoLineItemSchema], default: [] })
  items: PoLineItem[];

  @Prop({ required: true, min: 0 })
  calculatedTotal: number;
}

export const FgsItemSchema = SchemaFactory.createForClass(FgsItem);
