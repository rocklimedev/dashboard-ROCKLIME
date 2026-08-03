import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Product } from '@/modules/product/models/product.model'; // adjust to your actual model path
import { META_SLUGS } from '../utils/meta-slugs.constant';
import { ProductInputDto } from '../dto/product-input.dto';
import {
  EnrichedProduct,
  ProductMasterInfo,
} from '../utils/quotation.interface';
import { QuotationCalculationService } from './quotation-calculation.service';

@Injectable()
export class QuotationProductEnrichmentService {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    private readonly calculationService: QuotationCalculationService,
  ) {}

  /** Safely pull a value out of a product's freeform `meta` JSON blob. */
  private getMetaValue(meta: unknown, uuid: string): string | null {
    if (!meta || !uuid) return null;

    let parsed: any = meta;
    if (typeof meta === 'string') {
      try {
        parsed = JSON.parse(meta);
      } catch {
        return null;
      }
    }
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed[uuid] || null;
  }

  /** Normalizes the many shapes `images` can arrive in into a single URL. */
  private extractFirstImageUrl(imagesField: unknown): string | null {
    if (!imagesField) return null;

    try {
      if (Array.isArray(imagesField)) {
        return imagesField[0] || null;
      }

      if (typeof imagesField === 'string') {
        const trimmed = imagesField.trim();

        if (trimmed.startsWith('http')) {
          return trimmed;
        }

        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed[0] || null;
        }

        if (typeof parsed === 'string' && parsed.startsWith('http')) {
          return parsed;
        }
      }

      return null;
    } catch {
      const str = String(imagesField).trim();
      if (str.startsWith('http')) {
        return str.replace(/^["']|["']$/g, '');
      }
      return null;
    }
  }

  /** Fetches product master rows for the given ids and maps them by productId. */
  async fetchProductMasterMap(
    productIds: string[],
    transaction?: Transaction,
  ): Promise<Record<string, ProductMasterInfo>> {
    const productMap: Record<string, ProductMasterInfo> = {};

    if (productIds.length === 0) return productMap;

    const dbProducts = await this.productModel.findAll({
      where: { productId: productIds },
      attributes: [
        'productId',
        'name',
        'images',
        'product_code',
        'meta',
        'tax',
        'discountType',
      ],
      transaction,
    });

    dbProducts.forEach((p: any) => {
      productMap[p.productId] = {
        name: p.name?.trim() || 'Unnamed Product',
        imageUrl: this.extractFirstImageUrl(p.images),
        productCode: p.product_code || null,
        companyCode: this.getMetaValue(p.meta, META_SLUGS.companyCode),
        tax: p.tax || 0,
        discountType: p.discountType || 'percent',
      };
    });

    return productMap;
  }

  /**
   * Enriches raw incoming product DTOs with product-master data, validates
   * per-location assigned quantities against the line's total quantity, and
   * computes the line total. Throws BadRequestException on overflow.
   */
  enrichProducts(
    incomingProducts: ProductInputDto[],
    productMap: Record<string, ProductMasterInfo>,
  ): EnrichedProduct[] {
    return incomingProducts.map((p) => {
      const id = (p.productId || p.id) as string;
      const db = productMap[id] || ({} as Partial<ProductMasterInfo>);

      const price = Number(p.price || 0);
      const totalQuantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || 'percent';

      let locations: EnrichedProduct['locations'] = [];
      let validatedTotalAssignedQty = 0;

      if (Array.isArray(p.locations) && p.locations.length > 0) {
        p.locations.forEach((loc) => {
          const assignedQty = Number(loc.assignedQuantity) || 0;
          if (assignedQty > 0) {
            validatedTotalAssignedQty += assignedQty;
            locations!.push({
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
        // Backward compatibility with single-location payloads
        locations!.push({
          floorId: p.floorId,
          floorName: p.floorName || null,
          roomId: p.roomId || null,
          roomName: p.roomName || null,
          assignedQuantity: totalQuantity,
        });
        validatedTotalAssignedQty = totalQuantity;
      }

      if (validatedTotalAssignedQty > totalQuantity) {
        throw new BadRequestException(
          `Quantity overflow for product ${p.name || id}. Total assigned (${validatedTotalAssignedQty}) > available (${totalQuantity})`,
        );
      }

      if (locations!.length === 0) {
        locations = null;
      }

      const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor);

      return {
        productId: id,
        name: p.name || db.name || 'Unknown Product',
        imageUrl:
          p.imageUrl && p.imageUrl.trim() !== ''
            ? p.imageUrl
            : db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,

        quantity: totalQuantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0,
        priority: Number(p.priority ?? 0),
        total: (discountType === 'percent'
          ? price * totalQuantity * (1 - discount / 100)
          : (price - discount) * totalQuantity
        ).toFixed(2),

        isOptionFor: isOption
          ? p.parentProductId || p.isOptionFor || null
          : null,
        optionType: p.optionType || null,
        groupId:
          p.groupId ||
          (isOption ? null : this.calculationService.generateGroupId()),

        locations,
        floorId: locations?.[0]?.floorId || null,
        floorName: locations?.[0]?.floorName || null,
        roomId: locations?.[0]?.roomId || null,
        roomName: locations?.[0]?.roomName || null,
      };
    });
  }
}
