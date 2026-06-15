import { ArrowUp, ArrowDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { votesApi } from '../../api/votes';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function VoteButton({ feedbackId, upvotes = 0, downvotes = 0, voteType = null, onVote }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upCount, setUpCount] = useState(upvotes);
  const [downCount, setDownCount] = useState(downvotes);
  const [selected, setSelected] = useState(voteType);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUpCount(upvotes);
    setDownCount(downvotes);
    setSelected(voteType);
  }, [upvotes, downvotes, voteType]);

  const handleVote = async (type, e) => {
    if (e) e.stopPropagation();
    if (!user) { toast.error('Login to vote'); navigate('/login'); return; }
    if (loading) return;

    setLoading(true);
    try {
      const res = await votesApi.toggle(feedbackId, type);
      const value = res.data;

      setUpCount(value.upvotes_count);
      setDownCount(value.downvotes_count);
      setSelected(value.vote_type);

      onVote?.({
        id: feedbackId,
        votes_count: value.votes_count,
        upvotes_count: value.upvotes_count,
        downvotes_count: value.downvotes_count,
        user_vote_type: value.vote_type,
        has_voted: value.voted,
      });
    } catch {
      toast.error('Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-vote-col">
      <button
        className={`vote-btn up ${selected === 'up' ? 'voted' : ''}`}
        onClick={(e) => handleVote('up', e)}
        disabled={loading}
      >
        <ArrowUp size={14} />
        <span className="vote-btn-count">{upCount}</span>
      </button>
      <button
        className={`vote-btn down ${selected === 'down' ? 'voted' : ''}`}
        onClick={(e) => handleVote('down', e)}
        disabled={loading}
      >
        <ArrowDown size={14} />
        <span className="vote-btn-count">{downCount}</span>
      </button>
    </div>
  );
}