/**
 * Reply Component
 * 
 * Purpose:
 * - Render a single reply with avatar, metadata, content
 * - Provide actions: like, edit, delete (if owner)
 * - Keep UI responsive and resilient (optimistic updates; tolerate missing like API)
 */

import React, { useState } from 'react';
import { authenticatedFetch, API_BASE } from '../../../utils/auth';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import LetterAvatar from '../LetterAvatar';
import { formatRelative, formatUiDate } from '../../../utils/date';
import '../common.css';
import './Reply.css';
import './Likes.css';

export interface ReplyUserInfo {
  id: string;
  username: string;
}

export interface ReplyModel {
  id: string;
  content: string;
  user: ReplyUserInfo;
  comment_id: string;
  post_id: string;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
}

interface ReplyProps {
  reply: ReplyModel;
  currentUserId?: string;
  onUpdated?: (updated: ReplyModel) => void;
  onDeleted?: (replyId: string) => void;
}

const Reply: React.FC<ReplyProps> = ({ reply, currentUserId, onUpdated, onDeleted }) => {
  const isOwner = !!currentUserId && reply.user?.id === currentUserId;

  // Local like state (initialized from server counts)
  const [liked, setLiked] = useState(Boolean(reply.liked));
  const [likesCount, setLikesCount] = useState(reply.likes_count ?? 0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(reply.content);
  const [busy, setBusy] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesList, setLikesList] = useState<Array<{ id: string; user: { username: string; email: string }; created_at: string }>>([]);

  const toggleLike = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}/likes`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(Boolean(data.liked));
        setLikesCount(Number(data.likes_count) || 0);
      }
    } catch {}
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
      if (!res.ok) throw new Error('Failed to update reply');
      const updated = await res.json();
      onUpdated?.(updated);
      setEditing(false);
    } catch {} 
    finally {
      setBusy(false);
    }
  };

  const deleteReply = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}`, { method: 'DELETE' });
      if (res.status === 204) onDeleted?.(reply.id);
    } catch {}
    finally {
      setBusy(false);
    }
  };

  return (
    <div className="reply-item">
      <div className="reply-header">
        <LetterAvatar name={reply.user?.username || 'User'} size="small" />
        <div className="reply-meta">
          <div className="reply-username">{reply.user?.username}</div>
          <div className="reply-time">{formatRelative(reply.created_at)}</div>
        </div>
      </div>

      {/* Content / Edit */}
      {editing ? (
        <div className="reply-edit">
          <textarea
            className="reply-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <div className="reply-actions">
            <button className="comment-action" onClick={saveEdit} disabled={busy}>Save</button>
            <button className="comment-action" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="reply-content">{reply.content}</div>
      )}

      {/* Actions */}
      <div className="reply-footer">
        <button className={`comment-action ${liked ? 'liked' : ''}`} onClick={toggleLike} disabled={busy}>
          {React.createElement((liked ? FaHeart : FaRegHeart) as any, { className: 'action-icon' })}
        </button>
        <button
          className="comment-action likes-count-btn"
          title="View who liked this reply"
          disabled={!likesCount}
          onClick={async () => {
            if (!likesCount) return;
            setLikesOpen(true);
            setLikesLoading(true);
            try {
              const res = await authenticatedFetch(`${API_BASE}/api/social/replies/${reply.id}/likes`);
              if (res.ok) setLikesList(await res.json());
            } finally {
              setLikesLoading(false);
            }
          }}
        >
          {likesCount}
        </button>
        {isOwner && !editing && (
          <>
            <button className="comment-action" onClick={() => setEditing(true)} disabled={busy}>Edit</button>
            <button className="comment-action" onClick={deleteReply} disabled={busy}>Delete</button>
          </>
        )}
      </div>
      {likesOpen && (
        <div className="likes-modal-overlay" onClick={() => setLikesOpen(false)}>
          <div className="likes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="likes-modal-header">
              <h3>Reply Likes</h3>
              <button className="close-btn" onClick={() => setLikesOpen(false)}>×</button>
            </div>
            <div className="likes-modal-content">
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
                      <div className="like-date">{formatUiDate(lk.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reply;
