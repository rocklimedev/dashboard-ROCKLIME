import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PoItemDocument = HydratedDocument<PoItem>;

@Schema({ _id: false })
export class PoLineItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, trim: true })
  productName: string;

  @Prop({ trim: true })
  productCode: string;

  @Prop({ trim: true })
  companyCode: string;

  @Prop({ trim: true, default: null })
  imageUrl: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ min: 0 })
  mrp: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({
    type: String,
    enum: ['percent', 'fixed'],
    default: 'percent',
  })
  discountType: string;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  total: number;
}

export const PoLineItemSchema = SchemaFactory.createForClass(PoLineItem);

@Schema({
  timestamps: true,
  collection: 'po_items',
})
export class PoItem {
  @Prop({ required: true, index: true })
  poId: string;

  @Prop({ required: true, index: true })
  poNumber: string;

  @Prop({ required: true })
  vendorId: string;

  @Prop({
    type: [PoLineItemSchema],
    default: [],
  })
  items: PoLineItem[];

  @Prop({
    required: true,
    min: 0,
  })
  calculatedTotal: number;
}

export const PoItemSchema = SchemaFactory.createForClass(PoItem);

// Indexes
PoItemSchema.index({ poId: 1 });
PoItemSchema.index({ poNumber: 1 });
