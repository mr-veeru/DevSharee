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

import React, { useState, useEffect, useRef } from 'react';
import { FaGithub, FaEllipsisV, FaComment, FaShare, FaWhatsapp, FaInstagram, FaFacebook, FaCopy, FaEdit, FaTrash } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import LetterAvatar from './LetterAvatar';
import { FilePreview, getFileDownloadUrl } from '../../utils/fileUtils';
import Likes from './social/Likes';
import Comments from './social/Comments';
import { useToast } from './Toast';
import './PostCard.css';
import { formatRelative } from '../../utils/date';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onFileDownload?: (post: Post, file: { file_id: string; filename: string; content_type: string }) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onLikeToggle?: (postId: string, isLiked: boolean) => void;
  searchQuery?: string;
  highlightText?: (text: string, query: string) => React.ReactNode;
  currentUserId?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onFileDownload,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onLikeToggle,
  searchQuery = '',
  highlightText,
  currentUserId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showSuccess } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);


  const truncateDescription = (description: string, maxLength: number = 200) => 
    description.length <= maxLength ? description : description.substring(0, maxLength) + '...';

  const handleFileDownload = (file: { file_id: string; filename: string; content_type: string }) => {
    onFileDownload ? onFileDownload(post, file) : window.open(getFileDownloadUrl(post.id, file.file_id), '_blank');
  };

  const getUserDisplayName = () => post.author?.username || `User ${post.user_id.slice(-4)}`;
  const getPostUrl = () => `${window.location.origin}/post/${post.id}`;
  const getShareText = () => `Check out this post by ${getUserDisplayName()}: "${post.title}"`;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.className = 'clipboard-textarea';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  };

  const handleShare = async (platform: string) => {
    const url = getPostUrl();
    const text = getShareText();
    const shareText = text + ' ' + url;
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };
    
    if (shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    } else if (platform === 'instagram') {
      const tempLink = document.createElement('a');
      tempLink.href = 'instagram://direct';
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      
      const copySuccess = await copyToClipboard(shareText);
      setTimeout(() => {
        window.open('https://www.instagram.com/direct/inbox/', '_blank');
        showSuccess(copySuccess ? 'Instagram opened! Link copied to clipboard for easy pasting.' : 'Instagram opened! Please copy the link manually.');
      }, 500);
    } else if (platform === 'copy') {
      const copyResult = await copyToClipboard(url);
      showSuccess(copyResult ? 'Link copied successfully!' : 'Please copy the link manually from the address bar.');
    }
    setShowShareModal(false);
  };

  const isPostOwner = currentUserId && post.user_id === currentUserId;

  const handleEdit = () => {
    onEdit?.(post);
    setShowMenu(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDelete = () => {
    onDelete?.(post.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => setShowDeleteConfirm(false);

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
            <span className="post-date">{formatRelative(post.created_at)}</span>
          </div>
        </div>
        {isPostOwner && (
          <div className="post-menu-container" ref={menuRef}>
            <button 
              className="post-menu"
              onClick={() => setShowMenu(!showMenu)}
            >
              {React.createElement(FaEllipsisV as any, { className: "post-menu-icon" })}
            </button>
            
            {showMenu && (
              <div className="post-menu-dropdown">
                <button className="menu-item" onClick={handleEdit}>
                  {React.createElement(FaEdit as any, { className: "menu-icon" })}
                  Edit Post
                </button>
                <button className="menu-item delete" onClick={handleDelete}>
                  {React.createElement(FaTrash as any, { className: "menu-icon" })}
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
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
        <Likes 
          postId={post.id}
          initialLikesCount={post.likes_count}
          initialLiked={false}
          currentUserId={currentUserId}
          onLikeToggle={onLikeToggle ? (liked: boolean, count: number) => onLikeToggle(post.id, liked) : undefined}
        />
        <button 
          className="action-btn"
          onClick={() => setShowComments((v) => !v)}
        >
          {React.createElement(FaComment as any, { className: "action-icon" })}
          <span>{commentsCount}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowShareModal(true)}
        >
          {React.createElement(FaShare as any, { className: "action-icon" })}
          <span>Share</span>
        </button>
      </div>
      {showComments && (
        <Comments 
          postId={post.id}
          currentUserId={currentUserId}
          onCountsChange={(count) => setCommentsCount(count)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Post</h3>
              <button className="close-btn" onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div className="share-modal-content">
              <div className="share-options">
                {[
                  { key: 'whatsapp', icon: FaWhatsapp, label: 'WhatsApp' },
                  { key: 'twitter', icon: FaXTwitter, label: 'X (Twitter)' },
                  { key: 'facebook', icon: FaFacebook, label: 'Facebook' },
                  { key: 'instagram', icon: FaInstagram, label: 'Instagram' },
                  { key: 'copy', icon: FaCopy, label: 'Copy Link' }
                ].map(({ key, icon: Icon, label }) => (
                  <button 
                    key={key}
                    className={`share-option ${key}`}
                    onClick={() => handleShare(key)}
                  >
                    {React.createElement(Icon as any, { className: "share-icon" })}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>Delete Post</h3>
            </div>
            <div className="delete-modal-content">
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="delete-modal-actions">
                <button className="cancel-btn" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
