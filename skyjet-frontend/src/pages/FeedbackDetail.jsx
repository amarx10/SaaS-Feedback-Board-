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
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [replyParentId, setReplyParentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  const [voteLoading, setVoteLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const [showEdit, setShowEdit] = useState(false);

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
    } catch (error) {
      toast.error('Feedback not found');
      console.error('Feedback load error:', error);
      navigate('/feedback');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED COMMENTS LOADING (NO SILENT FAIL)
  const loadComments = async () => {
    setCommentsLoading(true);

    try {
      const res = await commentsApi.getAll(id);
      setComments(res.data.data || []);

    } catch (error) {
      toast.error('Could not load comments.');
      console.error('Comments load error:', error);

    } finally {
      setCommentsLoading(false);
    }
  };

  const handleVote = async (type) => {
    if (!user) {
      toast.error('Login to vote');
      navigate('/login');
      return;
    }

    setVoteLoading(true);

    try {
      const res = await votesApi.toggle(id, type);
      const voteData = res.data;

      setFeedback(f => ({
        ...f,
        votes_count: voteData.votes_count,
        upvotes_count: voteData.upvotes_count,
        downvotes_count: voteData.downvotes_count,
        user_vote_type: voteData.vote_type,
        has_voted: voteData.voted,
      }));

      toast.success(voteData?.vote_type ? `${voteData.vote_type === 'up' ? 'Upvoted' : 'Downvoted'}!` : 'Vote removed');

    } catch (error) {
      toast.error('Failed to vote');
      console.error('Vote error:', error);

    } finally {
      setVoteLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Login to follow');
      navigate('/login');
      return;
    }

    setFollowLoading(true);

    try {
      await api.post(`/feedback/${id}/follow`);

      const wasFollowing = feedback.is_following;
      setFeedback(f => ({ ...f, is_following: !f.is_following }));
      toast.success(wasFollowing ? 'Unfollowed' : 'Following');

    } catch (error) {
      toast.error('Failed to follow');
      console.error('Follow error:', error);

    } finally {
      setFollowLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user) return toast.error('Login to comment');
    if (!commentText.trim()) return;

    setCommentLoading(true);

    try {
      await commentsApi.create(id, { body: commentText });

      setCommentText('');
      loadComments();

      setFeedback(f => ({
        ...f,
        comments_count: f.comments_count + 1
      }));

      toast.success('Comment added');

    } catch (error) {
      toast.error('Failed to comment');
      console.error('Comment error:', error);

    } finally {
      setCommentLoading(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!user) return toast.error('Login to reply');
    if (!replyText.trim()) return;

    setReplyLoading(true);

    try {
      await commentsApi.create(id, {
        body: replyText,
        parent_id: parentId
      });

      setReplyText('');
      setReplyParentId(null);
      loadComments();

      setFeedback(f => ({
        ...f,
        comments_count: f.comments_count + 1
      }));

      toast.success('Reply added');

    } catch (error) {
      toast.error('Failed to reply');
      console.error('Reply error:', error);

    } finally {
      setReplyLoading(false);
    }
  };

  const updateCommentInTree = (comments, commentId, updater) => {
    return comments.map(c => {
      if (c.id === commentId) return updater(c);
      return {
        ...c,
        replies: c.replies ? updateCommentInTree(c.replies, commentId, updater) : undefined
      };
    });
  };

  const removeCommentFromTree = (comments, commentId) => {
    return comments
      .filter(c => c.id !== commentId)
      .map(c => ({
        ...c,
        replies: c.replies ? removeCommentFromTree(c.replies, commentId) : undefined
      }));
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const res = await commentsApi.remove(commentId);

      setComments(cs => removeCommentFromTree(cs, commentId));

      const newCount = res.data?.data?.comments_count;
      if (newCount !== undefined) {
        setFeedback(f => ({ ...f, comments_count: newCount }));
      }

      setReplyParentId(null);
      toast.success('Comment deleted');

    } catch (error) {
      toast.error('Failed to delete');
      console.error('Delete comment error:', error);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await commentsApi.update(commentId, { body: editText });

      setComments(cs =>
        updateCommentInTree(cs, commentId, comment => ({ ...comment, body: editText }))
      );

      setEditingComment(null);
      setEditText('');
      toast.success('Comment updated');

    } catch (error) {
      toast.error('Failed to update');
      console.error('Edit comment error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await feedbackApi.remove(id);
      toast.success('Feedback deleted');
      navigate('/feedback');

    } catch (error) {
      toast.error('Failed to delete');
      console.error('Delete feedback error:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!feedback) return null;

  const renderCommentThread = (comment, depth = 0) => {
    const isAdminComment = comment.is_admin_response || comment.user?.is_admin;
    return (
      <div key={comment.id} className={`comment-item ${isAdminComment ? 'comment-item--admin' : ''}`}>
        <div className={`comment-card ${isAdminComment ? 'comment-card--admin' : ''}`}>
          <div className="comment-header">
            <div className="comment-user-row">
              <Avatar user={comment.user} size="sm" />
              <span className="comment-username">{comment.user?.name || 'Anonymous'}</span>
              {isAdminComment && <span className="comment-admin-badge">Admin</span>}
              <span className="comment-time">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
            </div>
            <div className="comment-actions">
              {user && depth === 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setReplyParentId(replyParentId === comment.id ? null : comment.id)}
                >
                  Reply
                </button>
              )}
              {(user?.id === comment.user?.id || user?.is_admin) && (
                <>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditText(comment.body);
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="btn btn-danger-ghost btn-sm btn-icon"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
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
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
              />
              <div className="flex gap-1 mt-1">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleEditComment(comment.id)}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingComment(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="comment-text">{comment.body}</p>
          )}
        </div>

        {replyParentId === comment.id && user && (
          <div className="comment-reply-form">
            <div className="comment-form">
              <Avatar user={user} size="sm" />
              <div className="comment-input-wrap">
                <textarea
                  className="comment-textarea"
                  placeholder={`Reply to ${comment.user?.name}`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-between items-center mt-1">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setReplyParentId(null);
                      setReplyText('');
                    }}
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

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map(reply => renderCommentThread(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="detail-layout">

        {/* MAIN */}
        <div className="detail-main">

          {/* Feedback card */}
          <div className="detail-card">
            <div className="detail-card-body">

              <h1 className="detail-title">{feedback.title}</h1>
              <p className="detail-desc">{feedback.description}</p>

              {/* Admin Response */}
              {feedback.admin_response && (
                <div className="detail-admin-response">
                  <div className="detail-admin-label flex items-center gap-1"><ShieldCheck size={12} /> Admin Response</div>
                  <p className="detail-admin-text">{feedback.admin_response}</p>
                </div>
              )}

              <div className="detail-meta-bar">
                {feedback.user && (
                  <div className="detail-meta-item">
                    <Avatar user={feedback.user} size="xs" />
                    <span>{feedback.user.name}</span>
                  </div>
                )}
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

          {/* COMMENTS */}
          <div className="detail-card comments-section">

            <div className="comments-header">
              <MessageSquare size={20} />
              Comments ({feedback.comments_count})
            </div>

            {/* COMMENT INPUT */}
            {user && (
              <div className="comment-form-wrap">
                <div className="comment-form">
                  <Avatar user={user} size="sm" />
                  <div className="comment-input-wrap">
                    <textarea
                      className="comment-textarea"
                      placeholder="Add a comment…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: 'auto', paddingLeft: 14, paddingRight: 14 }}
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

            {/* COMMENTS LIST */}
            {commentsLoading ? (
              <div style={{ padding: 20 }}>
                Loading comments...
              </div>

            ) : comments.length === 0 ? (
              <div style={{ padding: 20 }}>
                No comments yet. Be the first to comment.
              </div>

            ) : (
              <div className="comments-list">
                {comments.map(comment => renderCommentThread(comment))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="detail-aside">

          {/* Vote Panel */}
          <div className="detail-card">
            <div className="vote-panel">
              <div className="vote-panel-count">{feedback.votes_count}</div>
              <div className="vote-panel-label">Votes</div>
              <button
                className={`vote-panel-btn up ${feedback.user_vote_type === 'up' ? 'voted' : ''}`}
                onClick={() => handleVote('up')}
                disabled={voteLoading}
              >
                <ArrowUp size={14} />
                <span>{feedback.upvotes_count || 0}</span>
              </button>
              <button
                className={`vote-panel-btn down ${feedback.user_vote_type === 'down' ? 'voted' : ''}`}
                onClick={() => handleVote('down')}
                disabled={voteLoading}
              >
                <ArrowDown size={14} />
                <span>{feedback.downvotes_count || 0}</span>
              </button>
            </div>
          </div>

          {/* Follow Button */}
          <div className="detail-card">
            <div className="widget-body" style={{ padding: 12 }}>
              <button
                className={`btn w-full ${feedback.is_following ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {feedback.is_following ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {feedback.is_following ? 'Following' : 'Follow updates'}
              </button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="detail-card">
            <div className="widget-body">
              {feedback.category && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CATEGORY</div>
                  <Badge label={feedback.category.name} color={feedback.category.color} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>STATUS</div>
                <StatusBadge status={feedback.status} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CREATED</div>
                <div style={{ fontSize: 12 }}>{new Date(feedback.created_at).toLocaleDateString()}</div>
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

      {/* Delete Modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Feedback"
        subtitle="This action cannot be undone."
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete this feedback?</p>
      </Modal>
    </div>
  );
}