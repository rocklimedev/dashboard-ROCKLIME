import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { InjectModel as InjectSequelizeModel } from '@nestjs/sequelize';
import { Model } from 'mongoose';
import { Request } from 'express';
import * as sanitizeHtml from 'sanitize-html';
import { Comment, CommentDocument } from '../models/comment.schema';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Customer } from '../models/customer.model';
import { NotificationService } from '../common/notification/notification.service';
import { ActivityLogService } from '../common/activity-log/activity-log.service';
import { CreateCommentDto, ResourceType } from './dto/create-comment.dto';
import { FetchCommentsDto } from './dto/fetch-comments.dto';

const RESOURCE_MODELS: Record<ResourceType, any> = {
  Order: Order,
  Product: Product,
  Customer: Customer,
};

@Injectable()
export class CommentsService {
  constructor(
    @InjectMongoModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectSequelizeModel(User) private readonly userModel: typeof User,
    @InjectSequelizeModel(Order) private readonly orderModel: typeof Order,
    private readonly notifications: NotificationService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private async validateResource(
    resourceId: string,
    resourceType: ResourceType,
  ) {
    const Model = RESOURCE_MODELS[resourceType];
    if (!Model)
      throw new BadRequestException(`Invalid resourceType: ${resourceType}`);
    const resource = await Model.findByPk(resourceId);
    if (!resource) throw new NotFoundException(`${resourceType} not found`);
    return resource;
  }

  async getComments(dto: FetchCommentsDto) {
    await this.validateResource(dto.resourceId, dto.resourceType);
    return this.fetchCommentsWithUsers(
      dto.resourceId,
      dto.resourceType,
      dto.page,
      dto.limit,
    );
  }

  /** Shared by the orders module too (order detail pages embed recent comments). */
  async fetchCommentsWithUsers(
    resourceId: string,
    resourceType: string,
    pageNum: number,
    limitNum: number,
  ) {
    const comments = await this.commentModel
      .find({ resourceId, resourceType })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment: any) => {
        const user = await this.userModel.findOne({
          where: { userId: String(comment.userId) },
          attributes: ['userId', 'username', 'name'],
        });
        return { ...comment, user: user ? user.toJSON() : null };
      }),
    );

    const totalCount = await this.commentModel.countDocuments({
      resourceId,
      resourceType,
    });

    return { comments: commentsWithUsers, totalCount };
  }

  async addComment(dto: CreateCommentDto, req?: Request) {
    const userId = String(dto.userId || '').trim();
    if (!userId || userId === 'null' || userId === 'undefined') {
      throw new BadRequestException('userId is required and must be valid');
    }

    let user: User | null = null;
    try {
      user = await this.userModel.findOne({
        where: { userId },
        attributes: ['userId', 'username', 'name'],
      });
    } catch {
      // never fail the request just because the user lookup errored
    }

    await this.validateResource(dto.resourceId, dto.resourceType);

    const hasReachedLimit = await (
      this.commentModel as any
    ).hasReachedCommentLimit(dto.resourceId, dto.resourceType, userId);
    if (hasReachedLimit) {
      throw new BadRequestException(
        `Max 3 comments allowed on this ${dto.resourceType.toLowerCase()}`,
      );
    }

    const sanitizedComment = sanitizeHtml(dto.comment.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });
    if (!sanitizedComment) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const newComment = await this.commentModel.create({
      resourceId: dto.resourceId,
      resourceType: dto.resourceType,
      userId,
      comment: sanitizedComment,
      userSnapshot: {
        name: user?.name || 'Unknown User',
        username: user?.username || null,
      },
    } as any);

    const populatedComment = {
      ...newComment.toObject(),
      user: user
        ? { userId: user.userId, username: user.username, name: user.name }
        : {
            userId,
            username: null,
            name: (newComment as any).userSnapshot?.name || 'Unknown User',
          },
    };

    await this.activityLog.log({
      userId,
      contextTag: 'SYSTEM',
      subContext: dto.resourceType.toUpperCase(),
      action: 'CREATE_COMMENT',
      entityId: dto.resourceId,
      entityName: dto.resourceType,
      description: `Comment added on ${dto.resourceType} by ${user?.name || 'Unknown'}`,
      metadata: {
        preview: sanitizedComment.slice(0, 120),
        commentId: (newComment as any)._id,
        userName: user?.name || null,
      },
      req,
    });

    if (dto.resourceType === 'Order') {
      const order = await this.orderModel.findByPk(dto.resourceId);
      if (order) {
        const senderName = user?.name || 'Someone';
        const recipientIds = [
          order.createdFor,
          order.createdBy,
          order.assignedUserId,
          order.secondaryUserId,
        ];
        await this.notifications.sendMany(
          recipientIds,
          `New Comment on Order #${order.orderNo}`,
          `${senderName} commented: "${sanitizedComment}"`,
        );
      }
    }

    return populatedComment;
  }

  async deleteCommentsByResource(
    resourceId: string,
    resourceType: ResourceType,
  ) {
    await this.validateResource(resourceId, resourceType);

    const result = await this.commentModel.deleteMany({
      resourceId,
      resourceType,
    });

    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Comments Deleted for ${resourceType}`,
      message: `${result.deletedCount} comments deleted for ${resourceType} ID ${resourceId}`,
    });

    return { deletedCount: result.deletedCount };
  }

  async deleteComment(commentId: string, userId: string, req?: Request) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.userId !== userId) {
      throw new ForbiddenException('Unauthorized to delete this comment');
    }

    await this.activityLog.log({
      userId,
      contextTag: 'SYSTEM',
      subContext: comment.resourceType?.toUpperCase(),
      action: 'DELETE_COMMENT',
      entityId: comment.resourceId,
      entityName: comment.resourceType,
      description: `Comment deleted on ${comment.resourceType}`,
      oldValues: {
        commentId: comment._id,
        comment: comment.comment,
        resourceId: comment.resourceId,
        resourceType: comment.resourceType,
      },
      newValues: null,
      metadata: {
        deletedByUser: true,
        ownerUserId: comment.userId,
        preview: comment.comment?.slice(0, 120),
      },
      req,
    });

    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Comment Deleted on ${comment.resourceType}`,
      message: `Comment on ${comment.resourceType} ID ${comment.resourceId} by user ${userId} has been deleted: "${comment.comment}"`,
    });

    await this.commentModel.findByIdAndDelete(commentId);
  }
}
