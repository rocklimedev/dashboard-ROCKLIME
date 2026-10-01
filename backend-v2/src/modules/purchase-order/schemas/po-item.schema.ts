import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PoLineItem } from './fgs-item.schema';

const PoLineItemSchema = SchemaFactory.createForClass(PoLineItem);

@Schema({ timestamps: true, collection: 'po_items' })
export class PoItem extends Document {
  @Prop({ required: true, index: true })
  poId: string;

  @Prop({ required: true, index: true })
  poNumber: string;

  @Prop({ required: true })
  vendorId: string;

  @Prop({ type: [PoLineItemSchema], default: [] })
  items: PoLineItem[];

  @Prop({ required: true, min: 0 })
  calculatedTotal: number;
}

export const PoItemSchema = SchemaFactory.createForClass(PoItem);
