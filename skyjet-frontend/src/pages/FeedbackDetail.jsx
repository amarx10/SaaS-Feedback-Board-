import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedbackApi } from '../api/feedback';
import { commentsApi } from '../api/comments';
import { votesApi } from '../api/votes';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import FeedbackForm from '../components/feedback/FeedbackForm';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUp, ArrowDown, MessageSquare, Bookmark, BookmarkCheck,
  ArrowLeft, Pencil, Trash2, ShieldCheck, Send
} from 'lucide-react';

export default function FeedbackDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyParentId, setReplyParentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadFeedback();
      loadComments();
    }
  }, [id, authLoading, user]);

  const loadFeedback = async () => {
    try {
      const res = await feedbackApi.getOne(id);
      setFeedback(res.data.data);
    } catch {
      toast.error('Feedback not found');
      navigate('/feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await commentsApi.getAll(id);
      setComments(res.data.data || []);
    } catch {}
  };

  const handleVote = async (type) => {
    if (!user) { toast.error('Login to vote'); navigate('/login'); return; }
    setVoteLoading(true);
    try {
      const res = await votesApi.toggle(id, type);
      const value = res.data;
      setFeedback(f => ({
        ...f,
        has_voted: value.voted,
        user_vote_type: value.vote_type,
        votes_count: value.votes_count,
        upvotes_count: value.upvotes_count,
        downvotes_count: value.downvotes_count,
      }));
    } catch {
      toast.error('Failed to vote');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) { toast.error('Login to follow'); navigate('/login'); return; }
    setFollowLoading(true);
    try {
      await api.post(`/feedback/${id}/follow`);
      setFeedback(f => ({ ...f, is_following: !f.is_following }));
      toast.success(feedback.is_following ? 'Unfollowed' : 'Following');
    } catch { toast.error('Failed'); }
    finally { setFollowLoading(false); }
  };

  const updateCommentInTree = (items, commentId, updater) => {
    return items.map(comment => {
      if (comment.id === commentId) {
        return updater(comment);
      }
      if (comment.replies?.length) {
        return { ...comment, replies: updateCommentInTree(comment.replies, commentId, updater) };
      }
      return comment;
    });
  };

  const removeCommentFromTree = (items, commentId) => {
    return items.reduce((acc, comment) => {
      if (comment.id === commentId) return acc;
      const updatedComment = comment.replies?.length
        ? { ...comment, replies: removeCommentFromTree(comment.replies, commentId) }
        : comment;
      return [...acc, updatedComment];
    }, []);
  };

  const handleComment = async () => {
    if (!user) { toast.error('Login to comment'); return; }
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await commentsApi.create(id, { body: commentText });
      setCommentText('');
      loadComments();
      setFeedback(f => ({ ...f, comments_count: f.comments_count + 1 }));
      toast.success('Comment added');
    } catch { toast.error('Failed to comment'); }
    finally { setCommentLoading(false); }
  };

  const handleReply = async (parentId) => {
    if (!user) { toast.error('Login to reply'); return; }
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await commentsApi.create(id, { body: replyText, parent_id: parentId });
      setReplyText('');
      setReplyParentId(null);
      loadComments();
      setFeedback(f => ({ ...f, comments_count: f.comments_count + 1 }));
      toast.success('Reply added');
    } catch { toast.error('Failed to reply'); }
    finally { setReplyLoading(false); }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await commentsApi.update(commentId, { body: editText });
      setComments(cs => updateCommentInTree(cs, commentId, comment => ({ ...comment, body: editText })));
      setEditingComment(null);
      toast.success('Comment updated');
    } catch { toast.error('Failed'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) return;

    try {
      await commentsApi.remove(commentId);
      setComments(cs => removeCommentFromTree(cs, commentId));
      setReplyParentId(prev => (prev === commentId ? null : prev));
      setFeedback(f => ({ ...f, comments_count: f.comments_count - 1 }));
      toast.success('Comment deleted');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await feedbackApi.remove(id);
      toast.success('Feedback deleted');
      navigate('/feedback');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!feedback) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="detail-layout">
        {/* Main */}
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-card-body">
              <div className="detail-tags">
                {feedback.category && (
                  <Badge label={feedback.category.name} color={feedback.category.color} />
                )}
                <StatusBadge status={feedback.status} />
                {feedback.is_pinned && (
                  <span className="badge" style={{ background: '#EFF6FF', color: '#2563EB' }}>📌 Pinned</span>
                )}
              </div>

              <h1 className="detail-title">{feedback.title}</h1>
              <p className="detail-desc">{feedback.description}</p>

              {feedback.admin_response && (
                <div className="detail-admin-response">
                  <div className="detail-admin-label flex items-center gap-1"><ShieldCheck size={12} /> Admin Response</div>
                  <p className="detail-admin-text">{feedback.admin_response}</p>
                </div>
              )}

              <div className="detail-meta-bar">
                <div className="detail-meta-item">
                  <Avatar user={feedback.user} size="xs" />
                  <span>{feedback.user?.name}</span>
                </div>
                <div className="detail-meta-item">
                  <MessageSquare size={12} />
                  {feedback.comments_count} comments
                </div>
                <div className="detail-meta-item">
                  {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                </div>
                {(feedback.is_owner || user?.is_admin) && (
                  <div className="flex items-center gap-1" style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowEdit(true)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-danger-ghost btn-sm btn-icon" onClick={() => setDeleteModal(true)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="detail-card comments-section" style={{ marginTop: 12 }}>
            <div className="comments-header">
              <MessageSquare size={20} />
              Comments ({feedback.comments_count})
            </div>

            {user && (
              <div className="comment-form-wrap">
                <div className="comment-form">
                  <Avatar user={user} size="sm" />
                  <div className="comment-input-wrap">
                    <textarea
                      className="comment-textarea"
                      placeholder="Add a comment…"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleComment}
                        disabled={commentLoading || !commentText.trim()}
                      >
                        <Send size={12} />
                        {commentLoading ? 'Posting…' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : comments.map(comment => {
                const isAdminComment = comment.is_admin_response || comment.user?.is_admin;
                return (
                  <div key={comment.id} className={`comment-item ${isAdminComment ? 'comment-item--admin' : ''}`}>
                    <div className={`comment-card ${isAdminComment ? 'comment-card--admin' : ''}`}>
                      <div className="comment-header">
                        <div className="comment-user-row">
                          <Avatar user={comment.user} size="sm" />
                          <span className="comment-username">{comment.user?.name}</span>
                          {isAdminComment && <span className="comment-admin-badge">Admin</span>}
                          <span className="comment-time">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="comment-actions">
                          {user && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setReplyParentId(prev => (prev === comment.id ? null : comment.id))}
                            >
                              Reply
                            </button>
                          )}
                          {(user?.id === comment.user?.id || user?.is_admin) && (
                            <>
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingComment(comment.id); setEditText(comment.body); }}>
                                <Pencil size={12} />
                              </button>
                              <button className="btn btn-danger-ghost btn-sm btn-icon" onClick={() => handleDeleteComment(comment.id)}>
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {editingComment === comment.id ? (
                        <div style={{ marginLeft: isAdminComment ? 0 : 36 }}>
                          <textarea
                            className="comment-textarea"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-1 mt-1">
                            <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(comment.id)}>Save</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="comment-text">{comment.body}</p>
                      )}
                    </div>

                    {replyParentId === comment.id && (
                      <div className="comment-reply-form">
                        <div className="comment-form">
                          <Avatar user={user} size="sm" />
                          <div className="comment-input-wrap">
                            <textarea
                              className="comment-textarea"
                              placeholder={`Reply to ${comment.user?.name}`}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              rows={2}
                            />
                            <div className="flex justify-between items-center mt-1">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setReplyParentId(null); setReplyText(''); }}
                                type="button"
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleReply(comment.id)}
                                disabled={replyLoading || !replyText.trim()}
                              >
                                {replyLoading ? 'Posting…' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {comment.replies?.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map(reply => {
                          const isAdminReply = reply.is_admin_response || reply.user?.is_admin;
                          const replyLabel = comment.user?.name ? `Replying to ${comment.user.name}` : 'Reply';
                          return (
                            <div key={reply.id} className="comment-item comment-item--reply">
                              <div className={`comment-card comment-card--reply ${isAdminReply ? 'comment-card--admin' : ''}`}>
                                <div className="comment-header">
                                  <div className="comment-user-row">
                                    <Avatar user={reply.user} size="sm" />
                                    <span className="comment-username">{reply.user?.name}</span>
                                    {isAdminReply && <span className="comment-admin-badge">Admin</span>}
                                    <span className="comment-time">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                                  </div>
                                  {(user?.id === reply.user?.id || user?.is_admin) && (
                                    <div className="comment-actions">
                                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingComment(reply.id); setEditText(reply.body); }}>
                                        <Pencil size={12} />
                                      </button>
                                      <button className="btn btn-danger-ghost btn-sm btn-icon" onClick={() => handleDeleteComment(reply.id)}>
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="comment-reply-label">{replyLabel}</div>
                                {editingComment === reply.id ? (
                                  <div style={{ marginLeft: isAdminReply ? 0 : 36 }}>
                                    <textarea
                                      className="comment-textarea"
                                      value={editText}
                                      onChange={e => setEditText(e.target.value)}
                                      rows={2}
                                    />
                                    <div className="flex gap-1 mt-1">
                                      <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(reply.id)}>Save</button>
                                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="comment-text comment-text--reply">{reply.body}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aside */}
        <div className="detail-aside">
          {/* Vote Panel */}
          <div className="widget">
            <div className="vote-panel">
              <div className="vote-panel-count">{feedback.votes_count}</div>
              <div className="vote-panel-label">net score</div>
              <div className="vote-panel-actions" style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <button
                  className={`vote-panel-btn up ${feedback.user_vote_type === 'up' ? 'voted' : ''}`}
                  onClick={() => handleVote('up')}
                  disabled={voteLoading}
                >
                  <ArrowUp size={16} />
                  {feedback.user_vote_type === 'up' ? 'Upvoted' : 'Upvote'}
                </button>
                <button
                  className={`vote-panel-btn down ${feedback.user_vote_type === 'down' ? 'voted' : ''}`}
                  onClick={() => handleVote('down')}
                  disabled={voteLoading}
                >
                  <ArrowDown size={16} />
                  {feedback.user_vote_type === 'down' ? 'Downvoted' : 'Downvote'}
                </button>
              </div>
              <div className="vote-panel-summary" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>{feedback.upvotes_count ?? 0} up</span>
                <span>{feedback.downvotes_count ?? 0} down</span>
              </div>
            </div>
          </div>

          {/* Follow */}
          {user && (
            <div className="widget">
              <div className="widget-body" style={{ padding: 12 }}>
                <button
                  className={`btn w-full ${feedback.is_following ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{ justifyContent: 'center' }}
                >
                  {feedback.is_following ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  {feedback.is_following ? 'Following' : 'Follow updates'}
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="widget">
            <div className="widget-header">Details</div>
            <div className="widget-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                  <StatusBadge status={feedback.status} />
                </div>
                {feedback.category && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 3 }}>Category</div>
                    <Badge label={feedback.category.name} color={feedback.category.color} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 3 }}>Submitted by</div>
                  <div className="flex items-center gap-2">
                    <Avatar user={feedback.user} size="xs" />
                    <span style={{ fontSize: 12 }}>{feedback.user?.name}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 3 }}>Submitted</div>
                  <div style={{ fontSize: 12 }}>{new Date(feedback.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <FeedbackForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={loadFeedback}
        existing={feedback}
      />

      {/* Delete Confirm */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Feedback"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Are you sure you want to delete this feedback? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}