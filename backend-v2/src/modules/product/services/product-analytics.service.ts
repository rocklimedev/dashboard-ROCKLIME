import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Category } from '@/modules/brands/models/category.model'; // TODO: adjust to your models barrel path
import { Product } from '../models/product.model';
import { Quotation } from '@/modules/quotation/models/quotation.model';
import { Order } from '@/modules/orders/models/order.model';
import { Keyword } from '@/modules/brands/models/keyword.model';
@Injectable()
export class ProductAnalyticsService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(Quotation) private readonly quotationModel: typeof Quotation,
    @InjectModel(Order) private readonly orderModel: typeof Order,
  ) {}

  async getTopSelling(limit = 10) {
    const salesMap = new Map<string, number>();

    const processItems = (items: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const id = item.productId;
        const qty = Number(item.quantity) || 0;
        if (id && qty > 0) salesMap.set(id, (salesMap.get(id) || 0) + qty);
      });
    };

    const quotations = await this.quotationModel.findAll({
      attributes: ['quotationId', 'products'],
      raw: true,
    });

    const quotationProductsMap = new Map<string, any[]>();
    (quotations as any[]).forEach((q) => {
      if (!q.products) return;
      try {
        const items =
          typeof q.products === 'string' ? JSON.parse(q.products) : q.products;
        processItems(items);
        if (Array.isArray(items))
          quotationProductsMap.set(q.quotationId, items);
      } catch {
        // skip malformed rows
      }
    });

    const orders = await this.orderModel.findAll({
      attributes: ['id', 'products', 'quotationId'],
      raw: true,
    });

    (orders as any[]).forEach((order) => {
      let itemsToUse: any[] | null = null;

      // Priority 1: the order's own products.
      if (order.products) {
        try {
          const parsed =
            typeof order.products === 'string'
              ? JSON.parse(order.products)
              : order.products;
          if (Array.isArray(parsed) && parsed.length > 0) itemsToUse = parsed;
        } catch {
          // ignore malformed
        }
      }

      // Priority 2: fall back to the linked quotation's products.
      if (
        !itemsToUse &&
        order.quotationId &&
        quotationProductsMap.has(order.quotationId)
      ) {
        itemsToUse = quotationProductsMap.get(order.quotationId)!;
      }

      if (itemsToUse) processItems(itemsToUse);
    });

    const salesArray = Array.from(salesMap, ([productId, totalSold]) => ({
      productId,
      totalSold,
    })).sort((a, b) => b.totalSold - a.totalSold);

    if (salesArray.length === 0) return { data: [], total: 0 };

    const topProductIds = salesArray.slice(0, 50).map((s) => s.productId);

    const products = await this.productModel.findAll({
      where: { productId: { [Op.in]: topProductIds } },
      order: [['name', 'ASC']],
      include: [
        {
          model: Keyword,
          as: 'keywords',
          attributes: ['id', 'keyword'],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['categoryId', 'name', 'slug'],
            },
          ],
        },
      ],
    });

    const enriched = products.map((product) => {
      const raw: any = product.toJSON();
      const metaObj = raw.meta
        ? typeof raw.meta === 'string'
          ? JSON.parse(raw.meta)
          : raw.meta
        : {};
      const images = raw.images
        ? typeof raw.images === 'string'
          ? JSON.parse(raw.images)
          : raw.images
        : [];

      const metaDetails = Object.entries(metaObj).map(([id, value]) => ({
        id,
        title: 'Unknown Field',
        slug: id,
        value: value != null ? String(value) : '',
        fieldType: 'text',
        unit: null,
      }));

      const keywords = (raw.keywords || []).map((k: any) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      const totalSold =
        salesArray.find((s) => s.productId === raw.productId)?.totalSold || 0;

      return {
        ...raw,
        images,
        meta: metaObj,
        metaDetails,
        keywords,
        totalSold,
      };
    });

    const finalTopProducts = enriched
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);

    return { data: finalTopProducts, total: finalTopProducts.length };
  }
}
