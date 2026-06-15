import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const SORT_OPTIONS = [
  { value: 'most_voted', label: 'Most Voted' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'trending', label: 'Trending' },
];

export default function FeedbackFilters({ categories = [], filters, onChange }) {
  const [search, setSearch] = useState(filters.search || '');
  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (search !== filters.search) {
        onChange({ ...filters, search, page: 1 });
      }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="filter-bar">
      <div className="filter-search-wrap">
        <Search className="filter-search-icon" />
        <input
          className="filter-search-input"
          placeholder="Search feedback..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <select
        className="filter-select"
        value={filters.category_id || ''}
        onChange={e => handleChange('category_id', e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        className="filter-select"
        value={filters.status || ''}
        onChange={e => handleChange('status', e.target.value)}
      >
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="under_review">Under Review</option>
        <option value="planned">Planned</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="closed">Closed</option>
      </select>
      <select
        className="filter-select"
        value={filters.sort || 'most_voted'}
        onChange={e => handleChange('sort', e.target.value)}
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}