import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities (add every new entity here as modules are migrated)
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/rbac/entities/role.entity';
import { Permission } from '../modules/rbac/entities/permission.entity';
import { RolePermission } from '../modules/rbac/entities/role-permission.entity';
import { Address } from '../modules/address/entities/address.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductMeta } from '../modules/products/entities/product-meta.entity';
import { InventoryHistory } from '../modules/products/entities/inventory-history.entity';
import { Keyword } from '../modules/products/entities/keyword.entity';
import { ProductKeyword } from '../modules/products/entities/product-keyword.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Quotation } from '../modules/quotations/entities/quotation.entity';
import { ActivityLog } from '../modules/engagement/entities/activity-log.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderActivity } from '../modules/orders/entities/order-activity.entity';
import { OrderDispatch } from '../modules/orders/entities/order-dispatch.entity';
import { OrderCreditNote } from '../modules/orders/entities/order-credit-note.entity';
import { OrderCreditNoteItem } from '../modules/orders/entities/order-credit-note-item.entity';
import { Vendor } from '../modules/vendors/entities/vendor.entity';
import { FieldGuidedSheet } from '../modules/purchase-order/entities/fgs.entity';
import { PurchaseOrder } from '../modules/purchase-order/entities/purchase-order.entity';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url');

        const common = {
          dialect: 'mysql' as const,
          logging: false,
          autoLoadModels: true,
          synchronize: false, // use migrations in real environments, never auto-sync in prod
          models: [
            User,
            Role,
            Permission,
            RolePermission,
            Address,
            Product,
            ProductMeta,
            InventoryHistory,
            Keyword,
            ProductKeyword,
            Customer,
            Quotation,
            ActivityLog,
            Order,
            OrderActivity,
            OrderDispatch,
            OrderCreditNote,
            OrderCreditNoteItem,
            Vendor,
            FieldGuidedSheet,
            PurchaseOrder,
          ],
          pool: {
            max: 5,
            min: 1,
            acquire: 20000,
            idle: 30000,
            evict: 10000,
          },
          dialectOptions: {
            connectTimeout: 15000,
          },
        };

        if (url) {
          return { ...common, uri: url };
        }

        return {
          ...common,
          host: config.get('database.host'),
          port: config.get('database.port'),
          username: config.get('database.user'),
          password: config.get('database.password'),
          database: config.get('database.name'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
