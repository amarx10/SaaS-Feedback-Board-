import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/layout/Layout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Dashboard from './pages/Dashboard';
import AllFeedback from './pages/AllFeedback';
import FeedbackDetail from './pages/FeedbackDetail';
import MyFeedback from './pages/MyFeedback';
import Voted from './pages/Voted';
import Following from './pages/Following';
import Roadmap from './pages/Roadmap';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';

import LoadingSpinner from './components/common/LoadingSpinner';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading…" />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      <Route element={<Layout />}>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/feedback"      element={<AllFeedback />} />
        <Route path="/feedback/:id"  element={<FeedbackDetail />} />
        <Route path="/roadmap"       element={<Roadmap />} />

        
        <Route path="/my-feedback"   element={<PrivateRoute><MyFeedback /></PrivateRoute>} />
        <Route path="/voted"         element={<PrivateRoute><Voted /></PrivateRoute>} />
        <Route path="/following"     element={<PrivateRoute><Following /></PrivateRoute>} />
        <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />

       
        <Route path="/admin"             element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/feedback"    element={<AdminRoute><AdminFeedback /></AdminRoute>} />
        <Route path="/admin/users"       element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/categories"  element={<AdminRoute><AdminCategories /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
                style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: 'var(--border-width) solid var(--border)',
                fontSize: 13,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}