import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuotationVersionDocument = HydratedDocument<QuotationVersion>;

export enum OptionType {
  VARIANT = 'variant',
  UPGRADE = 'upgrade',
  ADDON = 'addon',
  NONE = null as any,
}

@Schema({ _id: false })
export class QuotationItemVersion {
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
    default: 'fixed',
  })
  discountType: string;

  @Prop()
  tax: number;

  @Prop()
  total: number;

  // -----------------------------
  // Option / Grouping fields
  // -----------------------------

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

  // -----------------------------
  // Floor / Room / Area
  // -----------------------------

  @Prop({ default: null })
  floorId: string;

  @Prop({ default: null })
  floorName: string;

  @Prop({ default: null })
  roomId: string;

  @Prop({ default: null })
  roomName: string;

  @Prop({ default: null, index: true })
  areaId: string;

  @Prop({ default: null })
  areaName: string;

  @Prop({ default: null })
  areaValue: string;
}

export const QuotationItemVersionSchema =
  SchemaFactory.createForClass(QuotationItemVersion);

@Schema({
  timestamps: false,
  collection: 'quotation_versions',
})
export class QuotationVersion {
  @Prop({
    required: true,
    index: true,
  })
  quotationId: string;

  @Prop({
    required: true,
  })
  version: number;

  @Prop({
    type: Object,
    required: true,
  })
  quotationData: Record<string, any>;

  @Prop({
    type: [QuotationItemVersionSchema],
    default: [],
  })
  quotationItems: QuotationItemVersion[];

  @Prop({
    type: Array,
    default: [],
  })
  floors: any[];

  @Prop({
    default: 0,
  })
  totalFloors: number;

  @Prop({
    required: true,
  })
  updatedBy: string;

  @Prop({
    default: Date.now,
    index: true,
  })
  updatedAt: Date;
}

export const QuotationVersionSchema =
  SchemaFactory.createForClass(QuotationVersion);

// Compound unique index
QuotationVersionSchema.index({ quotationId: 1, version: 1 }, { unique: true });
