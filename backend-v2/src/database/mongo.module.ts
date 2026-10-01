import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * MongoDB stays in the stack for the same purpose it served in the legacy
 * app: activity logs, notifications, verification/refresh tokens, and
 * (optionally) the cached-permission collection. Everything transactional
 * and relational lives in MySQL via Sequelize (DatabaseModule).
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
      }),
    }),
  ],
})
export class MongoDatabaseModule {}
