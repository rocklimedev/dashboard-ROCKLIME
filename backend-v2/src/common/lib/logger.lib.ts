import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ApiLog,
  ApiLogDocument,
} from '../schemas/api-log.schema';

@Injectable()
export class ApiLoggerInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(ApiLog.name)
    private readonly apiLogModel: Model<ApiLogDocument>,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();

    const user = request.user;

    const userSnapshot = user
      ? {
          id: user.userId,
          name: user.name || user.username || 'Unknown',
          email: user.email || 'unknown@example.com',
        }
      : null;

    const logEntry = {
      method: request.method,
      route: request.originalUrl || request.url,

      status: null,

      userId: userSnapshot?.id ?? null,

      userSnapshot: userSnapshot
        ? {
            name: userSnapshot.name,
            email: userSnapshot.email,
          }
        : null,

      startTime: new Date(startTime),
      endTime: null,
      duration: null,

      body:
        request.method !== 'GET' &&
        request.method !== 'HEAD'
          ? request.body
          : undefined,

      query:
        request.query &&
        Object.keys(request.query).length
          ? request.query
          : undefined,

      ipAddress: request.ip,

      userAgent: request.headers['user-agent'],

      error: null,
    };

    // Fire-and-forget insert
    this.apiLogModel
      .create(logEntry)
      .then((log) => {
        const logId = log._id;

        const finish = () => {
          const endTime = Date.now();

          const update: any = {
            status: response.statusCode,
            endTime: new Date(endTime),
            duration: endTime - startTime,
          };

          if (response.statusCode >= 400) {
            update.error =
              response.statusMessage || 'Unknown Error';
          }

          this.apiLogModel
            .updateOne(
              { _id: logId },
              {
                $set: update,
              },
            )
            .catch(console.error);

          response.removeListener('finish', finish);
          response.removeListener('close', finish);
        };

        response.on('finish', finish);
        response.on('close', finish);
      })
      .catch((err) => {
        console.error('Failed to create API log', err);
      });

    return next.handle().pipe(
      tap(() => {}),
      catchError((err) => {
        throw err;
      }),
    );
  }
}