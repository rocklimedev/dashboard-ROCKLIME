import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';
import { User } from '@/modules/users/models/user.model';
import { Product } from '@/modules/product/models/product.model';
import { InventoryHistory } from '@/modules/product/models/inventory-history.model';
export interface ProductUpdate {
  productId: string;
  quantityToReduce: number;
  productRecord: Product;
}

export interface ReduceStockAndLogInput {
  productUpdates: ProductUpdate[];
  createdBy: string;
  orderNo: string;
  customMessage?: string;
  transaction: Transaction;
}

export interface RestoreStockInput {
  products: Array<{ id?: string; productId?: string; quantity?: number }>;
  orderNo: string;
}

/**
 * Everything related to stock movement (deduct on order create/update,
 * restore on cancel/delete) plus the InventoryHistory audit trail. This
 * used to be two free functions bolted onto the controller module.
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(InventoryHistory)
    private readonly inventoryHistoryModel: typeof InventoryHistory,
  ) {}

  async reduceStockAndLog({
    productUpdates,
    createdBy,
    orderNo,
    customMessage,
    transaction,
  }: ReduceStockAndLogInput): Promise<void> {
    if (!transaction) throw new BadRequestException('Transaction is required');

    const creator = await this.userModel.findByPk(createdBy, {
      attributes: ['username'],
      transaction,
    });
    const username = creator?.username || 'System';

    const autoMsg = `Stock removed by ${username} (Order #${orderNo})`;
    const msg = customMessage?.trim()
      ? `${customMessage} (${autoMsg})`
      : autoMsg;

    for (const upd of productUpdates) {
      const { productId, quantityToReduce, productRecord } = upd;
      if (quantityToReduce <= 0) continue;

      const newQty = productRecord.quantity - quantityToReduce;

      await this.productModel.update(
        { quantity: newQty },
        { where: { productId }, transaction },
      );

      await this.inventoryHistoryModel.create(
        {
          id: uuidv7(),
          productId,
          change: -quantityToReduce,
          quantityAfter: newQty,
          action: 'sale',
          orderNo: String(orderNo),
          userId: createdBy,
          message: msg,
        } as any,
        { transaction },
      );

      let newStatus = 'active';
      if (newQty === 0) {
        newStatus = 'out_of_stock';
      } else if (
        productRecord.alert_quantity != null &&
        newQty <= productRecord.alert_quantity
      ) {
        newStatus = 'low_stock';
      }

      if (newStatus !== productRecord.status) {
        await this.productModel.update(
          { status: newStatus },
          { where: { productId }, transaction },
        );
      }
    }
  }

  async restoreStock({ products, orderNo }: RestoreStockInput): Promise<void> {
    if (!products?.length) return;

    for (const p of products) {
      const productId = p.id || p.productId;
      const prod = await this.productModel.findByPk(productId);
      if (!prod) continue;

      const qtyToAdd = p.quantity ?? 0;
      const newQty = prod.quantity + qtyToAdd;

      await this.productModel.update(
        { quantity: newQty },
        { where: { productId: prod.productId } },
      );

      await this.inventoryHistoryModel.create({
        productId: prod.productId,
        change: qtyToAdd,
        quantityAfter: newQty,
        action: 'add-stock',
        orderNo,
        message: `Stock restored (order #${orderNo} cancelled/deleted)`,
      } as any);
    }
  }
}
