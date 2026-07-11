const Comment = require("../models/comment");
const { User } = require("../models");

/**
 * Fetches a page of comments for a given resource and hydrates each
 * comment with its author's user record (falls back to null if the
 * user no longer exists).
 */
const fetchCommentsWithUsers = async (
  resourceId,
  resourceType,
  pageNum,
  limitNum,
) => {
  const comments = await Comment.find({ resourceId, resourceType })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const commentsWithUsers = await Promise.all(
    comments.map(async (comment) => {
      const user = await User.findOne({
        where: { userId: String(comment.userId) },
        attributes: ["userId", "username", "name"],
      });
      return {
        ...comment,
        user: user ? user.toJSON() : null,
      };
    }),
  );

  const totalCount = await Comment.countDocuments({ resourceId, resourceType });

  return { comments: commentsWithUsers, totalCount };
};

module.exports = { fetchCommentsWithUsers };
