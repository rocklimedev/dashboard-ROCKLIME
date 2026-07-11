const Comment = require("../models/comment");
const sanitizeHtml = require("sanitize-html");
const { Order } = require("../models");
const { sendErrorResponse } = require("../utils/response.util");
const {
  validateResource,
  validateCommentInput,
  validateCommentFetchInput,
} = require("../utils/validation.util");
const { fetchCommentsWithUsers } = require("../services/comment.service");
const { sendNotification } = require("./notificationController");
const logActivity = require("../utils/activityLogger");
const { ADMIN_USER_ID } = require("../config/constants");

// GET comments (no notification needed)
exports.getComments = async (req, res) => {
  try {
    const { resourceId, resourceType, page = 1, limit = 10 } = req.query;

    const inputValidation = validateCommentFetchInput({
      resourceId,
      resourceType,
    });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    const { comments, totalCount } = await fetchCommentsWithUsers(
      resourceId,
      resourceType,
      pageNum,
      limitNum,
    );

    return res.status(200).json({
      comments,
      totalCount,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch comments", err.message);
  }
};

// Add a comment
exports.addComment = async (req, res) => {
  try {
    const { resourceId, resourceType, userId: rawUserId, comment } = req.body;

    // 1. Normalize userId
    const userId = String(rawUserId || "").trim();
    if (!userId || userId === "null" || userId === "undefined") {
      return sendErrorResponse(
        res,
        400,
        "userId is required and must be valid",
      );
    }

    // 2. Input validation
    const inputValidation = validateCommentInput({
      resourceId,
      resourceType,
      userId,
      comment,
    });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    // 3. Try to get user — but NEVER fail the request if missing
    let user = null;
    try {
      const { User } = require("../models");
      user = await User.findOne({
        where: { userId },
        attributes: ["userId", "username", "name"],
      });
    } catch (dbErr) {}

    // 4. Resource must exist
    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    // 5. Comment limit
    const hasReachedLimit = await Comment.hasReachedCommentLimit(
      resourceId,
      resourceType,
      userId,
    );
    if (hasReachedLimit) {
      return sendErrorResponse(
        res,
        400,
        `Max 3 comments allowed on this ${resourceType.toLowerCase()}`,
      );
    }

    // 6. Sanitize
    const sanitizedComment = sanitizeHtml(comment.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });
    if (!sanitizedComment) {
      return sendErrorResponse(res, 400, "Comment cannot be empty");
    }

    // 7. Save to MongoDB with snapshot
    const newComment = await Comment.create({
      resourceId,
      resourceType,
      userId,
      comment: sanitizedComment,
      userSnapshot: {
        name: user?.name || "Unknown User",
        username: user?.username || null,
      },
    });

    // 8. Build response (always has user object)
    const populatedComment = {
      ...newComment.toObject(),
      user: user
        ? {
            userId: user.userId,
            username: user.username,
            name: user.name,
          }
        : {
            userId,
            username: null,
            name: newComment.userSnapshot?.name || "Unknown User",
          },
    };

    // 9. Activity log
    await logActivity({
      userId,
      contextTag: "SYSTEM",
      subContext: resourceType.toUpperCase(),
      action: "CREATE_COMMENT",
      entityId: resourceId,
      entityName: resourceType,
      description: `Comment added on ${resourceType} by ${user?.name || "Unknown"}`,
      metadata: {
        preview: sanitizedComment.slice(0, 120),
        commentId: newComment._id,
        userName: user?.name || null,
      },
      req,
    });

    // 10. Notifications with fallback name
    if (resourceType === "Order") {
      const order = await Order.findByPk(resourceId);
      if (order) {
        const senderName = user?.name || "Someone";

        const recipientIds = new Set(
          [
            order.createdFor,
            order.createdBy,
            order.assignedUserId,
            order.secondaryUserId,
          ].filter(Boolean),
        );

        for (const recipientId of recipientIds) {
          await sendNotification({
            userId: recipientId,
            title: `New Comment on Order #${order.orderNo}`,
            message: `${senderName} commented: "${sanitizedComment}"`,
          });
        }
      }
    }

    // 11. Success — always 201
    return res.status(201).json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to add comment", err.message);
  }
};

// Delete comments by resource
exports.deleteCommentsByResource = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.body;

    const inputValidation = validateCommentInput({ resourceId, resourceType });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    const result = await Comment.deleteMany({ resourceId, resourceType });

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Comments Deleted for ${resourceType}`,
      message: `${result.deletedCount} comments deleted for ${resourceType} ID ${resourceId}`,
    });

    return res.status(200).json({
      message: `Deleted ${result.deletedCount} comments for ${resourceType}`,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to delete comments",
      err.message,
    );
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    if (comment.userId !== userId) {
      return sendErrorResponse(res, 403, "Unauthorized to delete this comment");
    }

    // Activity log
    await logActivity({
      userId,
      contextTag: "SYSTEM",
      subContext: comment.resourceType?.toUpperCase(),
      action: "DELETE_COMMENT",
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

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Comment Deleted on ${comment.resourceType}`,
      message: `Comment on ${comment.resourceType} ID ${comment.resourceId} by user ${userId} has been deleted: "${comment.comment}"`,
    });

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to delete comment", err.message);
  }
};
