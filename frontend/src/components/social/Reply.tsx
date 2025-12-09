/**
 * Reply Component
 * 
 * Displays individual replies to comments with like, edit, and delete actions.
 * Owner can edit or delete their replies with optimistic UI updates.
 */

import React, { useState, useRef, useEffect } from 'react';
import { authenticatedFetch, API_BASE } from '../../utils/token';
import { refreshNotificationCount } from '../../hooks/useNotifications';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import LetterAvatar from '../letterAvatar/LetterAvatar';
import { formatRelative, formatDisplayDate } from '../../utils/date';
import '../common/common.css';
import './Reply.css';
import './Likes.css';
import { Reply as ReplyType } from '../../types';
import { useToast } from '../toast/Toast';
import ConfirmModal from '../confirmModal/ConfirmModal';

interface ReplyProps {
  reply: ReplyType;
  currentUserId?: string;
  highlight?: boolean;
  onUpdated?: (updated: ReplyType) => void;
  onDeleted?: (replyId: string) => void;
}

const Reply: React.FC<ReplyProps> = ({ reply, currentUserId, highlight = false, onUpdated, onDeleted }) => {
  const [liked, setLiked] = useState(Boolean(reply.liked));
  const [likesCount, setLikesCount] = useState(reply.likes_count ?? 0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(reply.content);
  const [busy, setBusy] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesList, setLikesList] = useState<Array<{ id: string; user: { username: string; email: string }; created_at: string }>>([]);
  const editReplyInputRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Scroll to and highlight this reply if it's the target
  useEffect(() => {
    if (highlight && replyRef.current) {
      replyRef.current.classList.add('highlight');
      replyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => replyRef.current?.classList.remove('highlight'), 2500);
    }
  }, [highlight]);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}/likes`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(Boolean(data.liked));
        setLikesCount(Number(data.likes_count) || 0);
        // Refresh notification count after reply like (backend creates notification)
        refreshNotificationCount();
      } else {
        const error = await res.json().catch(() => ({}));
        showError(error.message || 'Failed to toggle like');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to toggle like');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    const payload = editValue.trim();
    if (!payload || busy) return;
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payload })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update reply');
      }
      const updated = await res.json();
      onUpdated?.(updated);
      setEditing(false);
      showSuccess('Reply updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update reply');
    } finally {
      setBusy(false);
    }
  };

  const deleteReply = async () => {
    setConfirmOpen(true);
  };

  const deleteReplyInner = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (res.ok || res.status === 200) {
        onDeleted?.(reply.id);
        showSuccess(result.message || 'Reply deleted successfully!');
      } else {
        throw new Error(result.message || 'Failed to delete reply');
      }
    } catch (error: any) {
      showError(error.message || 'Error deleting reply');
    }
  };

  return (
    <div ref={replyRef} className={`reply-item ${highlight ? 'highlight' : ''}`}>
      <div className="social-item-user">
        <LetterAvatar name={reply.user?.username || 'User'} size="small" />
        <div className="social-item-meta">
          <div className="social-item-username reply-username">{reply.user?.username}</div>
          <div className="social-item-time">{formatRelative(reply.created_at)}</div>
        </div>
      </div>

      {/* Content / Edit */}
      {editing ? (
        <div className="reply-edit">
          <textarea
            ref={editReplyInputRef}
            className="edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <div className="reply-actions">
            <button className="social-action-btn" onClick={saveEdit} disabled={busy}>Save</button>
            <button className="social-action-btn" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="reply-content">{reply.content}</div>
      )}

      {/* Actions */}
      <div className="reply-footer">
        <button className={`social-action-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} disabled={busy}>
          {liked ? <FaHeart className="action-icon" /> : <FaRegHeart className="action-icon" />}
        </button>
        <button
          className="social-action-btn likes-count-btn"
          title="View who liked this reply"
          disabled={!likesCount}
          onClick={async () => {
            if (!likesCount) return;
            setLikesOpen(true);
            setLikesLoading(true);
            try {
              const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}/likes`);
              if (res.ok) {
                setLikesList(await res.json());
              } else {
                showError('Failed to load likes');
              }
            } catch (error: any) {
              showError('Failed to load likes');
            } finally {
              setLikesLoading(false);
            }
          }}
        >
          {likesCount}
        </button>
        {currentUserId && reply.user?.id === currentUserId && !editing && (
          <>
            <button className="social-action-btn" onClick={() => {
              setEditing(true);
              // Auto-focus reply edit textarea after state update
              setTimeout(() => {
                editReplyInputRef.current?.focus();
              }, 0);
            }} disabled={busy}>Edit</button>
            <button className="social-action-btn" onClick={deleteReply} disabled={busy}>Delete</button>
          </>
        )}
      </div>
      {likesOpen && (
        <div className="modal-overlay" onClick={() => setLikesOpen(false)}>
          <div className="modal-content likes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reply Likes</h3>
              <button className="close-btn" onClick={() => setLikesOpen(false)}>×</button>
            </div>
            <div className="modal-body likes-modal-content">
              {likesLoading ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <div className="likes-list">
                  {likesList.map((lk) => (
                    <div key={lk.id} className="like-item">
                      <div className="like-user-info">
                        <div className="like-username">{lk.user.username}</div>
                        <div className="like-email">{lk.user.email}</div>
                      </div>
                      <div className="like-date">{formatDisplayDate(lk.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        title="Delete reply"
        description="Are you sure you want to delete this reply?"
        confirmLabel="Delete"
        loading={confirmBusy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (confirmBusy) return;
          setConfirmBusy(true);
          try {
            await deleteReplyInner();
            setConfirmOpen(false);
          } finally {
            setConfirmBusy(false);
          }
        }}
      />
    </div>
  );
};

export default Reply;
