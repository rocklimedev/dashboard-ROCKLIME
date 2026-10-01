import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class QuotationItemLine {
  @Prop() productId: string;
  @Prop() name: string;
  @Prop({ default: null }) parentProductId: string;
  @Prop() imageUrl: string;
  @Prop({ trim: true }) productCode: string;
  @Prop({ trim: true }) companyCode: string;
  @Prop() quantity: number;
  @Prop() price: number;
  @Prop() discount: number;
  @Prop({ enum: ['percent', 'fixed'], default: 'percent' }) discountType: string;
  @Prop() tax: number;
  @Prop() total: number;

  @Prop({ default: null }) isOptionFor: string;
  @Prop({ enum: ['variant', 'upgrade', 'addon', null], default: null }) optionType: string;
  @Prop({ default: null }) groupId: string;

  @Prop({ default: null }) floorId: string;
  @Prop({ default: null }) floorName: string;
  @Prop({ default: null }) roomId: string;
  @Prop({ default: null }) roomName: string;
  @Prop({ default: 0 }) priority: number;
  @Prop({ default: null }) areaId: string;
  @Prop({ default: null }) areaName: string;
  @Prop({ default: null }) areaValue: string;
}
const QuotationItemLineSchema = SchemaFactory.createForClass(QuotationItemLine);

@Schema()
export class QuotationItem extends Document {
  @Prop({ required: true, index: true })
  quotationId: string;

  @Prop({ type: [QuotationItemLineSchema], default: [] })
  items: QuotationItemLine[];
}

export const QuotationItemSchema = SchemaFactory.createForClass(QuotationItem);
