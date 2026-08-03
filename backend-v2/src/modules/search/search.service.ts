import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import {
  Product,
  Customer,
  Quotation,
  Order,
  Brand,
  Category,
  Vendor,
  PurchaseOrder,
} from '../models'; // Adjust path to your models

@Injectable()
export class SearchService {
  constructor(private readonly sequelize: Sequelize) {}

  async searchAll(query: string, page: number = 1, limit: number = 20) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        'Search query must be at least 2 characters long',
      );
    }

    const searchTerm = `%${query.trim()}%`;
    const rawQuery = query.trim().toLowerCase();
    const currentPage = page;
    const pageSize = Math.min(limit, 50);
    const offset = (currentPage - 1) * pageSize;

    const results: any = {};

    const searchConfigs = [
      {
        key: 'Product',
        model: Product,
        attributes: [
          'productId',
          'name',
          'product_code',
          'quantity',
          'images',
          'meta',
          'updatedAt',
        ],
        limit: pageSize,
        offset,
        order: [
          ['updatedAt', 'DESC'],
          ['name', 'ASC'],
        ],
        customWhere: () => ({
          [Op.or]: [
            { name: { [Op.like]: searchTerm } },
            { product_code: { [Op.like]: searchTerm } },
            this.sequelize.where(
              this.sequelize.fn(
                'LOWER',
                this.sequelize.cast(this.sequelize.col('meta'), 'CHAR'),
              ),
              Op.like,
              `%${rawQuery}%`,
            ),
          ],
        }),
      },
      {
        key: 'Customer',
        model: Customer,
        attributes: [
          'customerId',
          'name',
          'email',
          'mobileNumber',
          'customerType',
        ],
      },
      {
        key: 'Quotation',
        model: Quotation,
        attributes: [
          'quotationId',
          'document_title',
          'reference_number',
          'finalAmount',
          'quotation_date',
        ],
      },
      {
        key: 'Order',
        model: Order,
        attributes: ['id', 'orderNo', 'status', 'finalAmount', 'createdAt'],
      },
      {
        key: 'Brand',
        model: Brand,
        attributes: ['id', 'brandName', 'brandSlug'],
      },
      {
        key: 'Category',
        model: Category,
        attributes: ['categoryId', 'name'],
      },
      {
        key: 'Vendor',
        model: Vendor,
        attributes: ['id', 'vendorName'],
      },
      {
        key: 'PurchaseOrder',
        model: PurchaseOrder,
        attributes: ['id', 'poNumber', 'status', 'totalAmount', 'orderDate'],
      },
    ];

    await Promise.all(
      searchConfigs.map(async (config) => {
        try {
          const whereClause = config.customWhere
            ? config.customWhere()
            : {
                [Op.or]:
                  config.attributes?.map((field: string) => ({
                    [field]: { [Op.like]: searchTerm },
                  })) || [],
              };

          const limitToUse = config.limit || pageSize;
          const offsetToUse =
            config.offset !== undefined ? config.offset : offset;

          const { rows, count } = await config.model.findAndCountAll({
            where: whereClause,
            attributes: config.attributes,
            limit: limitToUse,
            offset: offsetToUse,
            order: config.order || [['createdAt', 'DESC']],
          });

          results[config.key] = {
            items: rows,
            total: count,
            page: currentPage,
            limit: limitToUse,
            totalPages: Math.ceil(count / limitToUse),
          };
        } catch (err) {
          console.error(`Error searching ${config.key}:`, err);
          results[config.key] = {
            items: [],
            total: 0,
            page: currentPage,
            limit: pageSize,
            totalPages: 0,
          };
        }
      }),
    );

    const totalResults = Object.values(results).reduce(
      (sum: number, cat: any) => sum + (cat.total || 0),
      0,
    );

    return {
      success: true,
      message: `Found ${totalResults} results for "${rawQuery}"`,
      data: results,
      meta: {
        totalResults,
        query: rawQuery,
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalResults / pageSize),
      },
    };
  }
}
