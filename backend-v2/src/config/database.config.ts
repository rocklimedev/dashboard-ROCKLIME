import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => ({
  dialect: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),

  autoLoadModels: true,

  // IMPORTANT: Keep FALSE in Production
  synchronize: configService.get<string>('NODE_ENV') === 'development',

  logging:
    configService.get<string>('NODE_ENV') === 'development'
      ? console.log
      : false,

  // ──────── IMPROVED CONNECTION POOL ────────
  pool: {
    max: 50, // Increased from 10 → Better for concurrent users
    min: 8, // Increased from 2
    acquire: 60000, // 60 seconds - wait longer before timeout
    idle: 30000, // 30 seconds - close idle connections
    evict: 10000, // Check for idle connections every 10s
  },

  // Model Definition Settings
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: false,
  },

  // Timezone (India)
  timezone: '+05:30',

  // Retry mechanism (helps with temporary DB glitches)
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
    ],
    max: 3,
  },
});

export default databaseConfig;
