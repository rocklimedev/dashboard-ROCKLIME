import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { Product } from '../models/product.model';
import { User } from '@/modules/users/models/user.model';
import { InventoryHistory } from '../models/inventory-history.model'; // TODO: adjust to your models barrel path

import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { BulkInventoryUpdateDto } from '../dto/bulk-inventory-update.dto';
import { COMPANY_CODE_META_ID } from '../constants/product.constants';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(InventoryHistory)
    private readonly historyModel: typeof InventoryHistory,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  private formatHistory(history: InventoryHistory) {
    return {
      id: history.id,
      action: history.action,
      change: history.change,
      quantityAfter: history.quantityAfter,
      timestamp: history.createdAt,
      orderNo: history.orderNo,
      userId: history.userId,
      message: history.message,
    };
  }

  private async resolveUsername(
    userId: string | undefined,
    transaction: any,
  ): Promise<string> {
    if (!userId) return 'unknown';
    const user = await this.userModel.findByPk(userId, {
      attributes: ['username'],
      transaction,
    });
    return user?.username || 'unknown';
  }

  async addStock(productId: string, dto: AdjustStockDto) {
    const result = await this.sequelize.transaction(async (t) => {
      const product = await this.productModel.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!product) throw new NotFoundException('Product not found');

      const newQuantity = product.quantity + dto.quantity;
      await product.update({ quantity: newQuantity }, { transaction: t });

      const username = await this.resolveUsername(dto.userId, t);
      const message =
        dto.message?.trim() ||
        `Stock added by ${username}${dto.orderNo ? ` (Order #${dto.orderNo})` : ''}`;

      const history = await this.historyModel.create(
        {
          productId,
          change: dto.quantity,
          quantityAfter: newQuantity,
          action: 'add-stock',
          orderNo: dto.orderNo || null,
          userId: dto.userId || null,
          message,
        },
        { transaction: t },
      );

      return { product, history };
    });

    return {
      message: 'Stock added successfully',
      product: result.product,
      inventoryHistory: this.formatHistory(result.history),
    };
  }

  async removeStock(productId: string, dto: AdjustStockDto) {
    try {
      const result = await this.sequelize.transaction(async (t) => {
        const product = await this.productModel.findByPk(productId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!product) throw new NotFoundException('Product not found');
        if (product.quantity < dto.quantity)
          throw new BadRequestException('Insufficient stock');

        const newQuantity = product.quantity - dto.quantity;
        await product.update({ quantity: newQuantity }, { transaction: t });

        const username = await this.resolveUsername(dto.userId, t);
        const message =
          dto.message?.trim() ||
          `Stock removed by ${username}${dto.orderNo ? ` (Order #${dto.orderNo})` : ''}`;

        const history = await this.historyModel.create(
          {
            productId,
            change: -dto.quantity,
            quantityAfter: newQuantity,
            action: 'remove-stock',
            orderNo: dto.orderNo || null,
            userId: dto.userId || null,
            message,
          },
          { transaction: t },
        );

        return { product, history };
      });

      return {
        message: 'Stock removed successfully',
        product: result.product,
        inventoryHistory: this.formatHistory(result.history),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async getHistory(productId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.historyModel.findAndCountAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'change',
        'quantityAfter',
        'action',
        'orderNo',
        'userId',
        'message',
        'createdAt',
      ],
    });

    return {
      message: 'Inventory history retrieved successfully',
      total: count,
      page,
      pages: Math.ceil(count / limit),
      history: rows.map((h) => ({
        id: h.id,
        change: h.change,
        quantityAfter: h.quantityAfter,
        action: h.action,
        orderNo: h.orderNo,
        userId: h.userId,
        message: h.message,
        timestamp: h.createdAt,
      })),
    };
  }

  async getLowStock(threshold = 20, limit = 20) {
    const products = await this.productModel.findAll({
      where: { quantity: { [Op.lte]: threshold } },
      attributes: [
        'productId',
        'name',
        'quantity',
        'alert_quantity',
        'product_code',
        'images',
        'status',
      ],
      order: [['quantity', 'ASC']],
      limit,
      raw: true,
    });

    const enriched = (products as any[]).map((p) => ({
      ...p,
      images: p.images
        ? typeof p.images === 'string'
          ? JSON.parse(p.images)
          : p.images
        : [],
      quantity: Number(p.quantity),
      alert_quantity: Number(p.alert_quantity || 20),
    }));

    return {
      success: true,
      totalLowStock: enriched.length,
      threshold,
      products: enriched,
    };
  }

  /**
   * Matches products by product_code OR by the Company Code meta field, then
   * adds the given quantity. Each row is independent — a failure in one row
   * is recorded in `failed` without aborting the rest of the batch, but the
   * whole batch still runs in a single transaction (matching the original
   * behavior) so a hard DB error rolls everything back together.
   */
  async bulkUpdate(dto: BulkInventoryUpdateDto) {
    const t = await this.sequelize.transaction();
    const results = {
      successCount: 0,
      failedCount: 0,
      success: [] as any[],
      failed: [] as any[],
    };

    try {
      for (const item of dto.updates) {
        let identifier: string | null = null;
        try {
          identifier = (item.company_code || item.product_code || '')
            .toString()
            .trim();
          if (!identifier)
            throw new Error('Product Code / Company Code is required');
          if (!item.quantity || item.quantity <= 0)
            throw new Error('Valid positive quantity is required');

          const product = await this.productModel.findOne({
            where: {
              [Op.or]: [
                { product_code: identifier },
                this.sequelize.literal(
                  `JSON_UNQUOTE(JSON_EXTRACT(meta, '$."${COMPANY_CODE_META_ID}"')) = ${this.sequelize.escape(identifier)}`,
                ),
              ],
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!product)
            throw new Error(`Product with code "${identifier}" not found`);

          const oldQuantity = Number(product.quantity || 0);
          const newQuantity = oldQuantity + item.quantity;

          const updateData: Record<string, any> = { quantity: newQuantity };
          if (
            item.selling_price !== undefined &&
            item.selling_price !== null &&
            !isNaN(item.selling_price)
          ) {
            updateData.selling_price = Number(item.selling_price);
          }

          await product.update(updateData, { transaction: t });

          const message =
            item.message?.trim() ||
            `Bulk stock update (+${item.quantity}) ${item.warehouse ? `at ${item.warehouse}` : ''} by System`;

          await this.historyModel.create(
            {
              productId: product.productId,
              change: item.quantity,
              quantityAfter: newQuantity,
              action: 'add-stock',
              orderNo: null,
              userId: item.userId || null,
              message,
              warehouse: item.warehouse || null,
            },
            { transaction: t },
          );

          results.success.push({
            productId: product.productId,
            product_code: product.product_code,
            company_code: identifier,
            oldQuantity,
            added: item.quantity,
            newQuantity,
          });
          results.successCount++;
        } catch (err) {
          results.failed.push({
            identifier: identifier || 'Unknown',
            error: (err as Error).message,
          });
          results.failedCount++;
        }
      }

      await t.commit();

      return {
        message: `Bulk inventory update completed. ${results.successCount} successful, ${results.failedCount} failed.`,
        ...results,
      };
    } catch (error) {
      await t.rollback();
      throw new InternalServerErrorException(
        `Bulk inventory update failed: ${(error as Error).message}`,
      );
    }
  }
}
