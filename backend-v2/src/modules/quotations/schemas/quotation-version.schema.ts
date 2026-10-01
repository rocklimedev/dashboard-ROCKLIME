import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class QuotationVersionItem {
  @Prop() productId: string;
  @Prop() name: string;
  @Prop() imageUrl: string;
  @Prop({ trim: true }) productCode: string;
  @Prop({ trim: true }) companyCode: string;
  @Prop() quantity: number;
  @Prop() price: number;
  @Prop() discount: number;
  @Prop({ default: 'fixed' }) discountType: string;
  @Prop() tax: number;
  @Prop() total: number;

  @Prop({ default: null }) isOptionFor: string;
  @Prop({ enum: ['variant', 'upgrade', 'addon', null], default: null }) optionType: string;
  @Prop({ default: null }) groupId: string;

  @Prop({ default: null }) floorId: string;
  @Prop({ default: null }) floorName: string;
  @Prop({ default: null }) roomId: string;
  @Prop({ default: null }) roomName: string;
  @Prop({ default: null }) areaId: string;
  @Prop({ default: null }) areaName: string;
  @Prop({ default: null }) areaValue: string;
}
const QuotationVersionItemSchema = SchemaFactory.createForClass(QuotationVersionItem);

@Schema({ timestamps: false })
export class QuotationVersion extends Document {
  @Prop({ required: true, index: true })
  quotationId: string;

  @Prop({ required: true })
  version: number;

  @Prop({ type: Object, required: true })
  quotationData: Record<string, any>;

  @Prop({ type: [QuotationVersionItemSchema], default: [] })
  quotationItems: QuotationVersionItem[];

  @Prop({ type: [Object], default: [] })
  floors: Record<string, any>[];

  @Prop({ default: 0 })
  totalFloors: number;

  @Prop({ required: true })
  updatedBy: string;

  @Prop({ default: Date.now, index: true })
  updatedAt: Date;
}

export const QuotationVersionSchema = SchemaFactory.createForClass(QuotationVersion);
QuotationVersionSchema.index({ quotationId: 1, version: 1 }, { unique: true });
