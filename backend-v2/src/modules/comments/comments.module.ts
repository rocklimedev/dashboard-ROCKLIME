import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from '../models/comment.schema';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { NotificationModule } from '../common/notification/notification.module';
import { ActivityLogModule } from '../common/activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    SequelizeModule.forFeature([User, Order]),
    NotificationModule,
    ActivityLogModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService], // consumed by OrdersModule for embedded comments
})
export class CommentsModule {}
