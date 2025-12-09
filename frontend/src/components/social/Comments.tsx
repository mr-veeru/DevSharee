/**
 * Comments Section Component
 * 
 * Displays comments for a post.
 * Supports comment creation, editing, deletion, and liking.
 * Includes pagination for large comment lists.
 */

import React, { useEffect, useState, useRef } from 'react';
import { formatRelative, formatDisplayDate } from '../../utils/date';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { API_BASE, authenticatedFetch } from '../../utils/token';
import { refreshNotificationCount } from '../../hooks/useNotifications';
import LetterAvatar from '../letterAvatar/LetterAvatar';
import { Comment, Like, Reply as ReplyType} from '../../types';
import { useToast } from '../toast/Toast';
import ConfirmModal from '../confirmModal/ConfirmModal';
import Reply from './Reply';
import '../common/common.css';
import './Likes.css';
import './Comments.css';

interface CommentsProps {
  postId: string;
  currentUserId?: string;
  onCountsChange?: (newCount: number) => void;
  highlightCommentId?: string;
  highlightReplyId?: string;
}

const Comments: React.FC<CommentsProps> = ({ postId, currentUserId, onCountsChange, highlightCommentId, highlightReplyId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [likesModalLoading, setLikesModalLoading] = useState(false);
  const [likesModalList, setLikesModalList] = useState<Like[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const { showSuccess, showError } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetCommentId, setConfirmTargetCommentId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent component when comment count changes (includes replies)
  useEffect(() => {
    // Calculate total count: comments + all replies
    const totalCount = comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0); // 1 for comment + replies count
    }, 0);
    onCountsChange?.(totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]); // Re-calculate when comments or replies change

  // Fetch all comments for this post
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/posts/${postId}/comments`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to load comments');
      }
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // After comments load, optionally highlight and scroll to a specific comment
  useEffect(() => {
    if (!comments || comments.length === 0) return;
    if (highlightCommentId) {
      const el = containerRef.current?.querySelector(`[data-comment-id="${highlightCommentId}"]`) as HTMLElement | null;
      if (el) {
        el.classList.add('highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.classList.remove('highlight'), 2500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, highlightCommentId]);

  // Add new comment to the post
  const handleAddComment = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to add comment');
      }
      const newComment: Comment = await res.json();
      setComments(prev => [newComment, ...prev]);
      setContent('');
      showSuccess('Comment added successfully!');
      // Refresh notification count after comment creation (backend creates notification)
      refreshNotificationCount();
    } catch (e: any) {
      setError(e.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if current user owns this comment (can edit/delete)
  const canEditOrDelete = (comment: Comment) => currentUserId && comment.user?.id === currentUserId;

  // Pagination: Show first 2 comments, then "show more" option
  const displayedComments = showAllComments ? comments : comments.slice(0, 2);
  const remainingCommentsCount = comments.length - 2;

  // Enter edit mode for a comment
  const beginEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditValue(comment.content);
    // Auto-focus edit textarea after state update
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Save edited comment content
  const saveEdit = async (commentId: string) => {
    const payload = editValue.trim();
    if (!payload) return;
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payload })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to update comment');
      }
      const updated: Comment = await res.json();
      setComments(prev => prev.map(c => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditValue('');
    } catch (e: any) {
      setError(e.message || 'Failed to update comment');
    }
  };


  const handleDelete = async (commentId: string) => {
    setConfirmTargetCommentId(commentId);
    setConfirmOpen(true);
  };

  const deleteCommentInner = async (commentId: string) => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/comments/${commentId}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (res.ok || res.status === 200) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        showSuccess(result.message || 'Comment deleted successfully!');
      } else {
        throw new Error(result.message || 'Failed to delete comment');
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Failed to delete comment';
      showError(errorMsg);
      setError(errorMsg);
    }
  };

  const handleAddReply = async (commentId: string) => {
    const content = (replyInputs[commentId] || '').trim();
    if (!content || submittingReply === commentId) return;
    setSubmittingReply(commentId);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/social/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to add reply');
      }
      const newReply: ReplyType = await res.json();
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [newReply, ...(comment.replies || [])], replies_count: (comment.replies_count || 0) + 1 }
          : comment
      ));
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
      showSuccess('Reply added successfully!');
      // Refresh notification count after reply creation (backend creates notification)
      refreshNotificationCount();
    } catch (e: any) {
      showError(e.message || 'Failed to add reply');
    } finally {
      setSubmittingReply(null);
    }
  };

  return (
    <div className="comments-section" ref={containerRef}>
      {/* Input */}
      <div className="comment-input">
        <textarea
          className="form-textarea"
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
          autoFocus
        />
        <button className="btn-primary comment-submit" onClick={handleAddComment} disabled={submitting || !content.trim()}>
          Comment
        </button>
      </div>

      {/* Error */}
      {error && <div className="comment-error">{error}</div>}

      {/* Comments list */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading"><div className="spinner spinner--small"></div></div>
        ) : (
          displayedComments.map((c) => (
            <div key={c.id} className="comment-item" data-comment-id={c.id}>
              <div className="social-item-header">
                <div className="social-item-user">
                  <LetterAvatar name={c.user?.username || 'User'} size="small" />
                  <div className="social-item-meta">
                    <div className="social-item-username">{c.user?.username}</div>
                    <div className="social-item-time">{formatRelative(c.created_at)}</div>
                  </div>
                </div>
                <div className="comment-actions">
                  {/* Like comment */}
                  <button
                    className={`social-action-btn ${c.liked ? 'liked' : ''}`}
                    onClick={async () => {
                      try {
                        const res = await authenticatedFetch(`${API_BASE}/api/social/comments/${c.id}/likes`, { method: 'POST' });
                        if (res.ok) {
                          const data = await res.json();
                          setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes_count: Number(data.likes_count) || 0, liked: Boolean(data.liked) } : x));
                          // Refresh notification count after comment like (backend creates notification)
                          refreshNotificationCount();
                        } else {
                          const error = await res.json().catch(() => ({}));
                          showError(error.message || 'Failed to toggle like');
                        }
                      } catch (e: any) {
                        showError(e.message || 'Failed to toggle like');
                      }
                    }}
                  >
                    {c.liked ? <FaHeart className="action-icon" /> : <FaRegHeart className="action-icon" />}
                  </button>
                  <button
                    className="social-action-btn likes-count-btn"
                    title="View who liked this comment"
                    disabled={!c.likes_count}
                    onClick={async () => {
                      if (!c.likes_count) return;
                      setLikesModalOpen(true);
                      setLikesModalLoading(true);
                      try {
                        const res = await authenticatedFetch(`${API_BASE}/api/social/comments/${c.id}/likes`);
                        if (res.ok) {
                          setLikesModalList(await res.json());
                        } else {
                          showError('Failed to load likes');
                        }
                      } catch (e: any) {
                        showError('Failed to load likes');
                      } finally {
                        setLikesModalLoading(false);
                      }
                    }}
                  >
                    {c.likes_count || 0}
                  </button>

                  {canEditOrDelete(c) && (
                    <>
                      {editingId === c.id ? (
                        <>
                          <button className="social-action-btn" onClick={() => saveEdit(c.id)}>Save</button>
                          <button className="social-action-btn" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="social-action-btn" onClick={() => beginEdit(c)}>Edit</button>
                          <button className="social-action-btn" onClick={() => handleDelete(c.id)}>Delete</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              {editingId === c.id ? (
                <div className="comment-edit">
                  <textarea
                    ref={editInputRef}
                    className="form-textarea"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                </div>
              ) : (
                <div className="comment-content">{c.content}</div>
              )}

              {/* Replies Section */}
              {c.replies && c.replies.length > 0 && (
                <div className="replies-section">
                  <div className="replies-list">
                    {c.replies.map((reply) => (
                      <Reply
                        key={reply.id}
                        reply={reply}
                        currentUserId={currentUserId}
                        highlight={highlightReplyId === reply.id}
                        onUpdated={(updated) => {
                          setComments(prev => prev.map(comment => 
                            comment.id === c.id 
                              ? { ...comment, replies: comment.replies?.map(r => r.id === updated.id ? updated : r) || [] }
                              : comment
                          ));
                        }}
                        onDeleted={(replyId) => {
                          setComments(prev => prev.map(comment => 
                            comment.id === c.id 
                              ? { ...comment, replies: comment.replies?.filter(r => r.id !== replyId) || [], replies_count: (comment.replies_count || 0) - 1 }
                              : comment
                          ));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input */}
              {replyingTo === c.id ? (
                <div className="reply-input-section">
                  <textarea
                    ref={(el) => { replyInputRefs.current[c.id] = el; }}
                    className="form-textarea reply-textarea"
                    placeholder="Write a reply..."
                    value={replyInputs[c.id] || ''}
                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                    disabled={submittingReply === c.id}
                  />
                  <div className="reply-input-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleAddReply(c.id)}
                      disabled={submittingReply === c.id || !replyInputs[c.id]?.trim()}
                    >
                      Reply
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyInputs(prev => ({ ...prev, [c.id]: '' }));
                      }}
                      disabled={submittingReply === c.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="text-link-btn"
                  onClick={() => {
                    setReplyingTo(c.id);
                    setTimeout(() => {
                      replyInputRefs.current[c.id]?.focus();
                    }, 0);
                  }}
                >
                  Reply
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Show remaining comments button */}
      {!loading && comments.length > 2 && (
        <div className="pagination">
          <button
            className="view-remaining-btn"
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments 
              ? 'Show less comments' 
              : `View remaining ${remainingCommentsCount} comments`
            }
          </button>
        </div>
      )}
      {likesModalOpen && (
        <div className="modal-overlay" onClick={() => setLikesModalOpen(false)}>
          <div className="modal-content likes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Comment Likes</h3>
              <button className="close-btn" onClick={() => setLikesModalOpen(false)}>×</button>
            </div>
            <div className="modal-body likes-modal-content">
              {likesModalLoading ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <div className="likes-list">
                  {likesModalList.map((like) => (
                    <div key={like.id} className="like-item">
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
      <ConfirmModal
        open={confirmOpen}
        title="Delete comment"
        description="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        loading={confirmBusy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!confirmTargetCommentId || confirmBusy) return;
          setConfirmBusy(true);
          try {
            await deleteCommentInner(confirmTargetCommentId);
            setConfirmOpen(false);
          } finally {
            setConfirmBusy(false);
          }
        }}
      />
    </div>
  );
};

export default Comments;
