/**
 * PostCard Component
 * 
 * Reusable component for displaying individual posts in the feed.
 * Features user info, post content, tech stack, files, and GitHub link.
 * 
 * @param {Object} post - Post data object
 * @param {Function} onFileDownload - Callback for file download
 * @returns {JSX.Element} PostCard component
 */

import React, { useState } from 'react';
import { FaGithub, FaEllipsisV, FaHeart, FaComment, FaShare } from 'react-icons/fa';
import LetterAvatar from './LetterAvatar';
import { FilePreview, getFileDownloadUrl } from '../../utils/fileUtils';
import './PostCard.css';

interface Post {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_link?: string;
  user_id: string;
  author: {
    username: string;
    id: string;
  };
  created_at: string;
  likes_count: number;
  comments_count: number;
  files: Array<{
    file_id: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
}

interface PostCardProps {
  post: Post;
  onFileDownload?: (post: Post, file: { file_id: string; filename: string; content_type: string }) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  searchQuery?: string;
  highlightText?: (text: string, query: string) => React.ReactNode;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onFileDownload,
  onLike,
  onComment,
  onShare,
  searchQuery = '',
  highlightText
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'Z');
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      
      if (diffInMs < 0) return 'just now';
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'just now';
    }
  };

  const truncateDescription = (description: string, maxLength: number = 200) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const handleFileDownload = (file: { file_id: string; filename: string; content_type: string }) => {
    if (onFileDownload) {
      onFileDownload(post, file);
    } else {
      // Default download behavior
      const url = getFileDownloadUrl(post.id, file.file_id);
      window.open(url, '_blank');
    }
  };

  const getUserDisplayName = () => {
    return post.author?.username || `User ${post.user_id.slice(-4)}`;
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) {
      onLike(post.id);
    }
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author">
          <LetterAvatar 
            name={getUserDisplayName()} 
            size="medium" 
          />
          <div className="author-info">
            <span className="author-name">{getUserDisplayName()}</span>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </div>
        <button className="post-menu">
          {React.createElement(FaEllipsisV as any, { className: "post-menu-icon" })}
        </button>
      </div>

      {/* Post Content */}
      <div className="post-content">
        <h3 className="post-title">
          {highlightText ? highlightText(post.title, searchQuery) : post.title}
        </h3>
        <div className="post-description">
          {isExpanded ? (
            <p>{highlightText ? highlightText(post.description, searchQuery) : post.description}</p>
          ) : (
            <p>{highlightText ? highlightText(truncateDescription(post.description), searchQuery) : truncateDescription(post.description)}</p>
          )}
          {post.description.length > 200 && (
            <button 
              className="read-more-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
        
        {/* Tech Stack */}
        {post.tech_stack && post.tech_stack.length > 0 && (
          <div className="post-tech-stack">
            <span className="tech-label">SKILLS</span>
            <div className="tech-tags">
              {post.tech_stack.map((tech, index) => (
                <span key={index} className="tech-tag">
                  #{highlightText ? highlightText(tech, searchQuery) : tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {post.files && post.files.length > 0 && (
          <div className="post-files">
            <div className="files-label">FILES</div>
            <div className="files-grid">
              {post.files.slice(0, showAllFiles ? post.files.length : 2).map((file, index) => (
                <div key={file.file_id} className="file-item">
                  <FilePreview
                    filename={file.filename}
                    contentType={file.content_type}
                    size={file.size}
                    onDownload={() => handleFileDownload(file)}
                  />
                </div>
              ))}
              {post.files.length > 2 && (
                <div 
                  className="file-more"
                  onClick={() => setShowAllFiles(!showAllFiles)}
                >
                  {showAllFiles 
                    ? `Show less` 
                    : `+${post.files.length - 2} more files`
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* GitHub Link */}
        {post.github_link && (
          <div className="post-github">
            <a 
              href={post.github_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link"
            >
              {React.createElement(FaGithub as any, { className: "github-icon" })}
              View project on GitHub →
            </a>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {React.createElement(FaHeart as any, { className: "action-icon" })}
          <span>{post.likes_count}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => onComment && onComment(post.id)}
        >
          {React.createElement(FaComment as any, { className: "action-icon" })}
          <span>{post.comments_count}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => onShare && onShare(post.id)}
        >
          {React.createElement(FaShare as any, { className: "action-icon" })}
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
