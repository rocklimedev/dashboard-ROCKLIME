import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FgsItemDocument = HydratedDocument<FgsItem>;

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Schema({ _id: false })
export class FgsLineItem {
  @Prop({
    required: true,
  })
  productId: string;

  @Prop({
    required: true,
    trim: true,
  })
  productName: string;

  @Prop({
    trim: true,
  })
  productCode: string;

  @Prop({
    trim: true,
  })
  companyCode: string;

  @Prop({
    trim: true,
    default: null,
  })
  imageUrl: string;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  unitPrice: number;

  @Prop({
    min: 0,
  })
  mrp: number;

  @Prop({
    default: 0,
    min: 0,
  })
  discount: number;

  @Prop({
    enum: Object.values(DiscountType),
    default: DiscountType.PERCENT,
  })
  discountType: DiscountType;

  @Prop({
    default: 0,
    min: 0,
  })
  tax: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;
}

export const FgsLineItemSchema = SchemaFactory.createForClass(FgsLineItem);

@Schema({
  timestamps: true,
  collection: 'fgs_items',
})
export class FgsItem {
  @Prop({
    required: true,
    index: true,
  })
  fgsId: string;

  @Prop({
    required: true,
    index: true,
  })
  fgsNumber: string;

  @Prop({
    required: true,
  })
  vendorId: string;

  @Prop({
    type: [FgsLineItemSchema],
    default: [],
  })
  items: FgsLineItem[];

  @Prop({
    required: true,
    min: 0,
  })
  calculatedTotal: number;

  createdAt: Date;
  updatedAt: Date;
}

export const FgsItemSchema = SchemaFactory.createForClass(FgsItem);

// Additional indexes
FgsItemSchema.index({ fgsId: 1 });
FgsItemSchema.index({ fgsNumber: 1 });
