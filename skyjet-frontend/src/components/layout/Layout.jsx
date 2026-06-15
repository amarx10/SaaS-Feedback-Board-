import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import api from '../../api/axios';

export default function Layout() {
  const [categories, setCategories] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
    
    api.get('/feedback', { params: { per_page: 1 } }).then(() => {}).catch(() => {});
    
    Promise.all([
      api.get('/feedback', { params: { status: 'open', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'under_review', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'planned', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'in_progress', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'completed', per_page: 1 } }),
    ]).then(([o, ur, p, ip, c]) => {
      setStatusCounts({
        open: o.data.data?.total || 0,
        under_review: ur.data.data?.total || 0,
        planned: p.data.data?.total || 0,
        in_progress: ip.data.data?.total || 0,
        completed: c.data.data?.total || 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        categories={categories}
        statusCounts={statusCounts}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && <div className="mobile-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="main-content">
        <Header onMenu={() => setSidebarOpen(open => !open)} />
        <main className="page-content">
          <Outlet context={{ categories, statusCounts }} />
        </main>
      </div>
    </div>
  );
}