import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Search, ShieldCheck, ShieldOff, UserCheck, UserX, Bell } from 'lucide-react';
export default function AdminUsers() {
  const { user } = useAuth();

  const currentIsSuperAdmin = Boolean(user?.is_super_admin);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [notifModal, setNotifModal] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '' });
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    load();
  }, [page, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;

      const res = await adminApi.allUsers(params);
      const d = res.data.data;

      setUsers(d.items || []);
      setPagination({
        current_page: d.current_page,
        last_page: d.last_page,
        total: d.total
      });
    } catch {
     toast.error('Failed to load users. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userItem) => {
    const message = userItem.is_active
      ? `Are you sure you want to suspend ${userItem.name}?`
      : `Are you sure you want to activate ${userItem.name}?`;

    if (!window.confirm(message)) return;

    try {
      await adminApi.toggleUser(userItem.id);
      toast.success(userItem.is_active ? 'User suspended' : 'User activated');
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed');
    }
  };

  const handleToggleAdmin = async (userItem) => {
    if (!currentIsSuperAdmin) {
      toast.error('Only the super admin can change admin privileges.');
      return;
    }

    if (!window.confirm(
      userItem.is_admin
        ? `Remove admin access from ${userItem.name}?`
        : `Make ${userItem.name} an admin?`
    )) return;

    try {
      await adminApi.toggleAdmin(userItem.id);
      toast.success(
        userItem.is_admin ? 'Admin access removed' : 'Admin access granted'
      );
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed');
    }
  };
const handleSendNotif = async () => {
  // ✅ Check title before sending request
  if (!notifForm.title.trim()) {
    toast.error('Title required');
    return;
  }

  // ✅ Check message before sending request
  if (!notifForm.message.trim()) {
    toast.error('Message required');
    return;
  }

  setNotifLoading(true);

  try {
    await adminApi.sendNotification(notifForm);

    toast.success('Notification sent to all users!');

    setNotifModal(false);
    setNotifForm({
      title: '',
      message: '',
    });

  } catch (error) {
  
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.title?.[0] ||
      error?.response?.data?.errors?.message?.[0] ||
      'Failed to send notification';

    toast.error(message);

  } finally {
    setNotifLoading(false);
  }
};

  return (
    <div className="page-content">
        <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Manage Users</h1>
            <p className="page-subtitle">
              {pagination.total} registered users
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setNotifModal(true)}
          >
            <Bell size={14} /> Notify All
          </button>
        </div>
      </div>

      <div className="filter-bar mb-3">
        <div className="filter-search-wrap">
          <Search className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search users…"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar user={u} size="sm" />
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>

                  <td className="text-muted">@{u.username}</td>
                  <td className="text-muted">{u.email}</td>

                  <td>
                    {u.is_super_admin ? (
                      <span className="badge badge-role-superadmin">Super Admin</span>
                    ) : u.is_admin ? (
                      <span className="badge badge-role-admin">Admin</span>
                    ) : (
                      <span className="badge badge-role-user">User</span>
                    )}
                  </td>

                  <td>
                    <span className={`badge ${u.is_active ? 'badge-status-active' : 'badge-status-suspended'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  <td className="text-muted text-sm">
                    {formatDistanceToNow(new Date(u.created_at), {
                      addSuffix: true
                    })}
                  </td>

                  <td>
                    <div className="table-action-btns">

                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={u.is_super_admin}
                        title={u.is_active ? 'Suspend' : 'Activate'}
                      >
                        {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>

                      <button
                        onClick={() => handleToggleAdmin(u)}
                        disabled={!currentIsSuperAdmin || u.is_super_admin}
                        title={u.is_admin ? 'Remove Admin' : 'Make Admin'}
                      >
                        {u.is_admin ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                      </button>

                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        onPageChange={setPage}
      />

      {/* Notification Modal */}
      <Modal
        open={notifModal}
        onClose={() => setNotifModal(false)}
        title="Notify All Users"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setNotifModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSendNotif}
              disabled={notifLoading}
            >
              {notifLoading ? 'Sending…' : 'Send Notification'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Notification title</label>
          <input
            className="form-input"
            placeholder="Enter notification title"
            value={notifForm.title}
            onChange={e =>
              setNotifForm(f => ({ ...f, title: e.target.value }))
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            className="form-textarea"
            placeholder="Enter notification message"
            value={notifForm.message}
            onChange={e =>
              setNotifForm(f => ({ ...f, message: e.target.value }))
            }
          />
        </div>
      </Modal>
    </div>
  );
}