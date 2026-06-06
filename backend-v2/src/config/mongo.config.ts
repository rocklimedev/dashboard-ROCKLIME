import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const MongodbConfig = MongooseModule.forRootAsync({
  imports: [ConfigModule],

  inject: [ConfigService],

  useFactory: (configService: ConfigService) => ({
    uri: configService.get<string>('MONGO_URI'),

    dbName: configService.get<string>('MONGO_DB_NAME'),

    retryAttempts: 3,
    retryDelay: 3000,

    connectionFactory: (connection) => {
      connection.on('connected', () => {
        console.log('✅ MongoDB connected');
      });

      connection.on('error', (err) => {
        console.error('❌ MongoDB error:', err);
      });

      return connection;
    },
  }),
});
