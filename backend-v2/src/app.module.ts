// src/app.module.ts
import { Module, Logger } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import your feature modules
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { VendorsModule } from './vendors/vendors.module';
import { BrandsModule } from './brands/brands.module';
import { CustomersModule } from './customers/customers.module';
import { AddressesModule } from './address/address.module';
import { OrdersModule } from './orders/orders.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { FieldGuidedSheetsModule } from './purchase-orders/field-guided-sheets.module';
import { NotificationsModule } from './notification/notification.module';
@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting (Prevents abuse)
    ThrottlerModule.forRoot({
      ttl: 60,           // Time to live in seconds
      limit: 100,        // Max requests per ttl
      ignoreUserAgents: [/bot/i], // Optional: ignore bots
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    VendorsModule,
    BrandsModule,
    CustomersModule,
    AddressesModule,
    OrdersModule,
    PurchaseOrdersModule,
    FieldGuidedSheetsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}