/**
 * Likes Component
 * 
 * Manages like/unlike functionality for posts with state synchronization.
 * Features like count display, likes list modal, and user-specific like status.
 */

import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { authenticatedFetch, API_BASE } from '../../utils/token';
import { refreshNotificationCount } from '../../hooks/useNotifications';
import { useToast } from '../toast/Toast';
import LetterAvatar from '../letterAvatar/LetterAvatar';
import './Likes.css';
import { formatDisplayDate } from '../../utils/date';
import { UserInfo } from '../../types';
import '../common/common.css';

interface LikesProps {
  postId: string;
  initialLikesCount: number;
  initialLiked: boolean;
  currentUserId?: string; // Pass current user ID to avoid multiple profile calls
  onLikeToggle?: (liked: boolean, count: number) => void;
}

interface Like {
  id: string;
  user: UserInfo;
  created_at: string;
}

const Likes: React.FC<LikesProps> = ({ 
  postId, 
  initialLikesCount, 
  initialLiked, 
  currentUserId,
  onLikeToggle 
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState<Like[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const hasCheckedLikeStatusRef = useRef(false);
  const { showError } = useToast();

  // Check if current user has liked this post (only once on mount, and only if initialLiked is not provided)
  useEffect(() => {
    // Skip if we already checked, or if initialLiked is already provided (trust the prop)
    if (!currentUserId || hasCheckedLikeStatusRef.current || initialLiked !== undefined) return;
    
    hasCheckedLikeStatusRef.current = true;
    
    const checkLikeStatus = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE}/api/social/posts/${postId}/likes`);
        if (response.ok) {
          const likes = await response.json();
          setLiked(likes.some((like: Like) => like.user.id === currentUserId));
        }
      } catch (error) {
        // Could not check like status, use initial value
      }
    };

    checkLikeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, currentUserId]); // initialLiked intentionally excluded - we only check once on mount

  // Toggle like status and update count
  const handleLikeToggle = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/social/posts/${postId}/like`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikesCount(data.likes_count);
        onLikeToggle?.(data.liked, data.likes_count);
        // Refresh notification count after like action (backend creates notification)
        refreshNotificationCount();
      } else {
        const error = await response.json().catch(() => ({}));
        showError(error.message || 'Failed to update like status');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch and display list of users who liked this post
  const handleShowLikes = async () => {
    if (likesCount === 0) return;
    
    setLoadingLikes(true);
    setShowLikesModal(true);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/social/posts/${postId}/likes`);
      
      if (response.ok) {
        setLikesList(await response.json());
      } else {
        const error = await response.json().catch(() => ({}));
        showError(error.message || 'Failed to load likes');
        setShowLikesModal(false);
      }
    } catch (error) {
      showError('Network error. Please try again.');
      setShowLikesModal(false);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleCloseModal = () => {
    setShowLikesModal(false);
    setLikesList([]);
  };

  return (
    <>
      <div className="likes-container">
        <button 
          className={`like-btn ${liked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleLikeToggle}
          disabled={loading}
          title={liked ? 'Unlike' : 'Like'}
        >
          {liked ? <FaHeart className="action-icon" /> : <FaRegHeart className="action-icon" />}
        </button>
        
        <button 
          className="likes-count-btn"
          onClick={handleShowLikes}
          disabled={likesCount === 0}
          title="View who liked this post"
        >
          {likesCount}
        </button>
      </div>

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content likes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Likes ({likesCount})</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body likes-modal-content">
              {loadingLikes ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <div className="likes-list">
                  {likesList.map((like) => (
                    <div key={like.id} className="like-item">
                      <LetterAvatar name={like.user.username || 'User'} size="small" />
                      <div className="like-user-info">
                        <div className="like-username">{like.user.username}</div>
                        <div className="like-email">{like.user.email}</div>
                      </div>
                      <div className="like-date">{formatDisplayDate(like.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Likes;
