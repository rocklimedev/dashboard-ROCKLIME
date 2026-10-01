import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Product } from '../../products/entities/product.entity';
import { META_SLUGS, extractFirstImageUrl, generateGroupId, getMetaValue } from '../helpers/misc.helpers';

interface ProductMapEntry {
  name: string;
  imageUrl: string | null;
  productCode: string | null;
  companyCode: string | null;
  tax: number;
  discountType: string;
}

@Injectable()
export class ProductEnrichmentService {
  constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

  /** Used by create/clone */
  async fetchProductMap(
    productIds: string[],
    transaction?: Transaction,
  ): Promise<Record<string, ProductMapEntry>> {
    const productMap: Record<string, ProductMapEntry> = {};
    if (productIds.length === 0) return productMap;

    const dbProducts = await this.productModel.findAll({
      where: { productId: { [Op.in]: productIds } } as any,
      attributes: ['productId', 'name', 'images', 'product_code', 'meta', 'tax', 'discountType'],
      transaction,
    });

    dbProducts.forEach((p) => {
      productMap[p.productId] = {
        name: p.name?.trim() || 'Unnamed Product',
        imageUrl: extractFirstImageUrl(p.images),
        productCode: p.product_code || null,
        companyCode: getMetaValue(p.meta, META_SLUGS.companyCode),
        tax: Number(p.tax) || 0,
        discountType: p.discountType || 'percent',
      };
    });

    return productMap;
  }

  /** Used by update - slightly different image parsing, ported as-is */
  async fetchProductMapForUpdate(
    productIds: string[],
    transaction?: Transaction,
  ): Promise<Record<string, ProductMapEntry>> {
    const productMap: Record<string, ProductMapEntry> = {};
    if (productIds.length === 0) return productMap;

    const dbProducts = await this.productModel.findAll({
      where: { productId: { [Op.in]: productIds } } as any,
      attributes: ['productId', 'name', 'images', 'product_code', 'meta', 'tax', 'discountType'],
      transaction,
    });

    dbProducts.forEach((p) => {
      let imageUrl: string | null = null;
      if (p.images) {
        try {
          imageUrl = (typeof p.images === 'string' ? JSON.parse(p.images) : p.images)?.[0] ?? null;
        } catch {
          /* ignore */
        }
      }
      productMap[p.productId] = {
        name: p.name?.trim() || 'Unnamed Product',
        imageUrl,
        productCode: p.product_code || null,
        companyCode: (p.meta as any)?.[META_SLUGS.companyCode] || null,
        tax: Number(p.tax) || 0,
        discountType: p.discountType || 'percent',
      };
    });

    return productMap;
  }

  enrichProductsForCreate(incomingProducts: any[], productMap: Record<string, ProductMapEntry>) {
    return incomingProducts.map((p, index) => {
      const id = p.productId || p.id;
      const db = productMap[id] || ({} as Partial<ProductMapEntry>);

      const price = Number(p.price || 0);
      const quantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || 'percent';

      const isOption =
        Boolean(p.isOption) || Boolean(p.isOptionFor) || Boolean(p.optionType && p.optionType !== 'main');
      const optionType = p.optionType || null;
      const parentProductId = p.parentProductId || p.isOptionFor || null;

      let locations: any[] = [];
      if (Array.isArray(p.locations) && p.locations.length > 0) {
        locations = p.locations
          .filter((loc: any) => loc.floorId && Number(loc.assignedQuantity) > 0)
          .map((loc: any) => ({
            floorId: loc.floorId,
            floorName: loc.floorName || `Floor ${loc.floorId}`,
            roomId: loc.roomId || null,
            roomName: loc.roomName || null,
            areaId: loc.areaId || null,
            areaName: loc.areaName || null,
            assignedQuantity: Number(loc.assignedQuantity),
          }));
      } else if (p.floorId) {
        locations = [
          {
            floorId: p.floorId,
            floorName: p.floorName || null,
            roomId: p.roomId || null,
            roomName: p.roomName || null,
            assignedQuantity: quantity,
          },
        ];
      }

      return {
        productId: id,
        name: p.name || db.name || 'Unknown Product',
        imageUrl: p.imageUrl || db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,
        quantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: Number(p.tax || 0),
        priority: Number(p.priority ?? index),
        isOption,
        optionType,
        isOptionFor: isOption ? parentProductId : null,
        parentProductId,
        groupId: p.groupId || (isOption ? null : generateGroupId()),
        locations: locations.length > 0 ? locations : null,
        floorId: locations[0]?.floorId || null,
        floorName: locations[0]?.floorName || null,
        roomId: locations[0]?.roomId || null,
        roomName: locations[0]?.roomName || null,
      };
    });
  }

  enrichProductsForUpdate(incomingProducts: any[], productMap: Record<string, ProductMapEntry>) {
    return incomingProducts.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || ({} as any);

      const price = Number(p.price || 0);
      const totalQuantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || 'percent';

      let locations: any[] = [];
      let validatedTotalAssignedQty = 0;

      if (Array.isArray(p.locations) && p.locations.length > 0) {
        p.locations.forEach((loc: any) => {
          const assignedQty = Number(loc.assignedQuantity) || 0;
          if (assignedQty > 0) {
            validatedTotalAssignedQty += assignedQty;
            locations.push({
              floorId: loc.floorId,
              floorName: loc.floorName || `Floor ${loc.floorId}`,
              roomId: loc.roomId || null,
              roomName: loc.roomName || null,
              areaId: loc.areaId || null,
              areaName: loc.areaName || null,
              assignedQuantity: assignedQty,
            });
          }
        });
      } else if (p.floorId) {
        locations.push({
          floorId: p.floorId,
          floorName: p.floorName || null,
          roomId: p.roomId || null,
          roomName: p.roomName || null,
          assignedQuantity: totalQuantity,
        });
        validatedTotalAssignedQty = totalQuantity;
      }

      if (validatedTotalAssignedQty > totalQuantity) {
        throw new Error(
          `Quantity overflow for product ${p.name || id}. Total assigned (${validatedTotalAssignedQty}) > available (${totalQuantity})`,
        );
      }

      const finalLocations = locations.length === 0 ? null : locations;
      const isOption = !!p.isOptionFor;

      return {
        productId: id,
        name: p.name || db.name || 'Unknown Product',
        imageUrl: p.imageUrl || db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,
        quantity: totalQuantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0,
        priority: Number(p.priority ?? 0),
        total: Number(
          discountType === 'percent'
            ? price * totalQuantity * (1 - discount / 100)
            : (price - discount) * totalQuantity,
        ),
        isOptionFor: isOption ? p.isOptionFor : null,
        optionType: p.optionType || null,
        groupId: p.groupId || (isOption ? null : generateGroupId()),
        locations: finalLocations,
        floorId: finalLocations?.[0]?.floorId || null,
        floorName: finalLocations?.[0]?.floorName || null,
        roomId: finalLocations?.[0]?.roomId || null,
        roomName: finalLocations?.[0]?.roomName || null,
      };
    });
  }

  enrichProductsForClone(originalProducts: any[], productMap: Record<string, ProductMapEntry>) {
    return originalProducts.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || ({} as any);

      const price = Number(p.price || 0);
      const totalQuantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || 'percent';

      let locations: any[] | null = null;
      let validatedTotalAssignedQty = 0;

      if (Array.isArray(p.locations) && p.locations.length > 0) {
        p.locations.forEach((loc: any) => {
          const assignedQty = Number(loc.assignedQuantity) || 0;
          if (assignedQty > 0) validatedTotalAssignedQty += assignedQty;
        });
        locations = p.locations;
      } else if (p.floorId) {
        locations = [
          {
            floorId: p.floorId,
            floorName: p.floorName || null,
            roomId: p.roomId || null,
            roomName: p.roomName || null,
            assignedQuantity: totalQuantity,
          },
        ];
      }

      if (validatedTotalAssignedQty > totalQuantity) {
        throw new Error(`Quantity overflow for product ${p.name || id}`);
      }
      if (locations && locations.length === 0) locations = null;

      const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor);

      return {
        productId: id,
        name: p.name || db.name || 'Unknown Product',
        imageUrl: p.imageUrl || db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,
        quantity: totalQuantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0,
        priority: Number(p.priority ?? 0),
        total: Number(
          discountType === 'percent'
            ? price * totalQuantity * (1 - discount / 100)
            : (price - discount) * totalQuantity,
        ),
        isOptionFor: isOption ? p.isOptionFor || p.parentProductId : null,
        optionType: p.optionType || null,
        groupId: p.groupId || (isOption ? null : generateGroupId()),
        locations,
        floorId: locations?.[0]?.floorId || null,
        floorName: locations?.[0]?.floorName || null,
        roomId: locations?.[0]?.roomId || null,
        roomName: locations?.[0]?.roomName || null,
      };
    });
  }
}
