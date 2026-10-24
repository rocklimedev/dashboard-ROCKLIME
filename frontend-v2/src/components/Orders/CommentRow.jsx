import './CommentRow.styles.css';
import React from 'react';
import { Typography, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;

  const userInitial = comment.user?.name ? comment.user.name[0].toUpperCase() : 'U';

  return (
    <div
      className={
        `comment-row ${isCurrentUser ? 'comment-row--own' : ''}` + ' fv2-commentrow-3dd8c6640f'
      }
      style={{ justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }}
    >
      <div
        className="fv2-commentrow-cac484b403"
        style={{ flexDirection: isCurrentUser ? 'row-reverse' : 'row' }}
      >
        {/* Avatar */}
        <div
          className="fv2-commentrow-44879ccb4a"
          style={{
            background: isCurrentUser ? '#1890ff' : '#d9d9d9',
            color: isCurrentUser ? '#fff' : '#333',
          }}
        >
          {userInitial}
        </div>

        {/* Bubble */}
        <div
          className="fv2-commentrow-4f81c181b2"
          style={{
            background: isCurrentUser ? '#1890ff' : '#f5f5f5',
            color: isCurrentUser ? '#fff' : '#111',
          }}
        >
          {/* Header */}
          <div className="fv2-commentrow-ec5375229e">
            <Text
              className="fv2-commentrow-9b4de349fa"
              strong
              style={{ color: isCurrentUser ? '#fff' : '#333' }}
            >
              {comment.user?.name || 'Unknown User'}
            </Text>

            {isCurrentUser && (
              <Button
                className="fv2-commentrow-8f8dda06f3"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(comment._id)}
                style={{ color: isCurrentUser ? '#fff' : '#ff4d4f' }}
              />
            )}
          </div>

          {/* Message */}
          <div className="fv2-commentrow-97f4bd178e">{comment.comment}</div>

          {/* Timestamp */}
          <div
            className="fv2-commentrow-9cbe8b93d3"
            style={{ textAlign: isCurrentUser ? 'right' : 'left' }}
          >
            {new Date(comment.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            • {new Date(comment.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentRow;
