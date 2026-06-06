import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuotationItemDocument = HydratedDocument<QuotationItem>;

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum OptionType {
  VARIANT = 'variant',
  UPGRADE = 'upgrade',
  ADDON = 'addon',
  NONE = null as any,
}

@Schema({ _id: false })
export class QuotationLineItem {
  @Prop()
  productId: string;

  @Prop()
  name: string;

  @Prop()
  imageUrl: string;

  @Prop({ trim: true })
  productCode: string;

  @Prop({ trim: true })
  companyCode: string;

  @Prop()
  quantity: number;

  @Prop()
  price: number;

  @Prop()
  discount: number;

  @Prop({
    type: String,
    enum: Object.values(DiscountType),
    default: DiscountType.PERCENT,
  })
  discountType: DiscountType;

  @Prop()
  tax: number;

  @Prop()
  total: number;

  // -----------------------------------
  // Optional grouping fields
  // -----------------------------------

  @Prop({ default: null })
  isOptionFor: string;

  @Prop({
    type: String,
    enum: ['variant', 'upgrade', 'addon', null],
    default: null,
  })
  optionType: string;

  @Prop({ default: null })
  groupId: string;

  // -----------------------------------
  // Floor & Room linkage
  // -----------------------------------

  @Prop({ default: null, index: true })
  floorId: string;

  @Prop({ default: null })
  floorName: string;

  @Prop({ default: null, index: true })
  roomId: string;

  @Prop({ default: null })
  roomName: string;

  @Prop({ default: 0, index: true })
  priority: number;

  @Prop({ default: null, index: true })
  areaId: string;

  @Prop({ default: null })
  areaName: string;

  @Prop({ default: null })
  areaValue: string;
}

export const QuotationLineItemSchema =
  SchemaFactory.createForClass(QuotationLineItem);

@Schema({
  timestamps: false,
})
export class QuotationItem {
  @Prop({
    required: true,
    index: true,
  })
  quotationId: string;

  @Prop({
    type: [QuotationLineItemSchema],
    default: [],
  })
  items: QuotationLineItem[];
}

export const QuotationItemSchema = SchemaFactory.createForClass(QuotationItem);

// Index
QuotationItemSchema.index({ quotationId: 1 });
