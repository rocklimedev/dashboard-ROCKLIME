import { Global, Module } from '@nestjs/common';
import IORedis from 'ioredis';
import { Queue, QueueEvents } from 'bullmq';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';
export const JOBS_QUEUE = 'JOBS_QUEUE';
export const JOBS_QUEUE_EVENTS = 'JOBS_QUEUE_EVENTS';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: async () => {
        const isProduction = process.env.NODE_ENV === 'production';

        const connection = new IORedis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,

          family: 4,
          connectTimeout: 10000,

          maxRetriesPerRequest: null,

          retryStrategy(times) {
            const delay = Math.min(times * 100, 5000);

            console.log(
              `[Redis] Retry attempt ${times} → waiting ${delay}ms`,
            );

            return delay;
          },

          tls:
            isProduction && process.env.REDIS_TLS === 'true'
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,

          enableAutoPipelining: true,

          lazyConnect: true,
        });

        connection.on('connect', () =>
          console.log('[Redis] Connected'),
        );

        connection.on('ready', () =>
          console.log('[Redis] Ready'),
        );

        connection.on('error', (err) =>
          console.error('[Redis] Error', err),
        );

        connection.on('reconnecting', (delay) =>
          console.log(`[Redis] Reconnecting in ${delay}ms`),
        );

        connection.on('close', () =>
          console.log('[Redis] Connection closed'),
        );

        try {
          await connection.connect();

          const pong = await connection.ping();

          console.log('[Redis] PING ->', pong);
        } catch (err) {
          console.error(
            '[Redis] Initial connection failed',
            err.message,
          );
        }

        return connection;
      },
    },

    {
      provide: JOBS_QUEUE,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: IORedis) => {
        return new Queue('jobs', {
          connection,

          defaultJobOptions: {
            removeOnComplete: {
              age: 3600 * 24 * 7,
            },

            removeOnFail: {
              count: 1000,
            },
          },
        });
      },
    },

    {
      provide: JOBS_QUEUE_EVENTS,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: IORedis) => {
        return new QueueEvents('jobs', {
          connection,
        });
      },
    },
  ],

  exports: [
    REDIS_CONNECTION,
    JOBS_QUEUE,
    JOBS_QUEUE_EVENTS,
  ],
})
export class BullMQModule {}