import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { MongoDatabaseModule } from './database/mongo.module';
import { UploadModule } from './common/upload/upload.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AddressModule } from './modules/address/address.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { CustomersModule } from './modules/customers/customers.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ActivityLogModule } from './modules/engagement/activity-log.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';

import { HealthController } from './health.controller';
import { NotificationsGateway } from './modules/engagement/notifications.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    // Two persistence layers, same split as the legacy app:
    // - MySQL/Sequelize for relational/business data
    // - MongoDB/Mongoose for logs, notifications, tokens, permission cache
    DatabaseModule,
    MongoDatabaseModule,
    UploadModule,
    ActivityLogModule,

    // Equivalent of middleware/rateLimit.js (apiLimiter / burstLimiter).
    // Per-route overrides (e.g. burstLimiter on /carts, /order, /quotation)
    // are applied with @Throttle() on those controllers as they're migrated.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Equivalent of node-cron usage in index.js (daily cache clear, etc).
    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    RbacModule,
    AddressModule,
    ProductsModule,
    CartModule,
    CustomersModule,
    QuotationsModule,
    OrdersModule,
    VendorsModule,
    PurchaseOrderModule,

    // TODO, in the same order as the legacy routes object in index.js:
    // BrandsModule (brand/category/parent-category/keyword/brand-parent),
    // SearchModule, JobsModule, EngagementModule (notifications, activity
    // controller), DeviceManagementModule.
    // See docs/MIGRATION_PLAN.md for the full checklist.
  ],
  controllers: [HealthController],
  providers: [NotificationsGateway],
})
export class AppModule {}
