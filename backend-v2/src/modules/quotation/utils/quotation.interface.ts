export type DiscountType = 'percent' | 'flat';

export interface ProductLocation {
  floorId: string;
  floorName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  assignedQuantity: number;
}

export interface EnrichedProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  companyCode: string | null;
  productCode: string | null;
  quantity: number;
  price: number;
  discount: number;
  discountType: DiscountType;
  tax: number;
  priority: number;
  total: string;
  isOptionFor: string | null;
  optionType: string | null;
  groupId: string | null;
  locations: ProductLocation[] | null;
  // Backward-compatible flattened fields (first location)
  floorId: string | null;
  floorName: string | null;
  roomId: string | null;
  roomName: string | null;
}

export interface FloorRoom {
  roomId: string;
  roomName: string;
  areas: unknown[];
  sortOrder: number;
}

export interface Floor {
  floorId: string;
  floorName: string;
  sortOrder: number;
  rooms: FloorRoom[];
}

export interface QuotationTotals {
  subTotal: number;
  totalItemDiscount: number;
  taxableAmount: number;
  extraDiscountAmount: number;
  shippingAmount: number;
  amountBeforeGst: number;
  roundOff: number;
  gstAmount: number;
  finalAmount: number;
  optionalItemsCount: number;
  optionalPotentialTotal: number;
}

export interface ProductMasterInfo {
  name: string;
  imageUrl: string | null;
  productCode: string | null;
  companyCode: string | null;
  tax: number;
  discountType: DiscountType;
}
