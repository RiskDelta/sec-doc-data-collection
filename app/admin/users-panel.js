'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    window.addEventListener('riskdelta-users-updated', loadUsers);
    return () => window.removeEventListener('riskdelta-users-updated', loadUsers);
  }, []);

  async function loadUsers() {
    const response = await fetch('/api/admin/users', {
      headers: {
        'x-admin-password': window.sessionStorage.getItem('riskdelta-admin-password') || ''
      }
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || 'Could not load users.');
      return;
    }

    setError('');
    setUsers(payload.users || []);
  }

  if (loading) {
    return <section className="panel muted">Loading users...</section>;
  }

  if (error) {
    return <section className="notice error">{error}</section>;
  }

  async function downloadCsv(userKey) {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userKey)}/export`, {
      headers: {
        'x-admin-password': window.sessionStorage.getItem('riskdelta-admin-password') || ''
      }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || 'Could not export CSV.');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userKey}-annotation-rows.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <section className="panel listPanel">
      <div className="listHeader users">
        <span>User</span>
        <span>Password</span>
        <span>Progress</span>
        <span>Updated</span>
        <span>Export</span>
      </div>

      {users.length === 0 ? <p className="emptyList muted">No uploaded user data yet.</p> : null}

      <div className="rowList">
        {users.map((user) => (
          <div className="rowItem users" key={user.user_key}>
            <span>
              <Link
                href={`/annotate/${encodeURIComponent(user.user_key)}`}
                onClick={() => {
                  window.sessionStorage.setItem(`riskdelta-password:${user.user_key}`, user.password);
                }}
              >
                <strong>{user.user_key}</strong>
              </Link>
              <small>{user.open} open rows</small>
            </span>
            <span>
              <code>{user.password}</code>
            </span>
            <span>
              {user.completed} / {user.total}
              <small>{percentage(user.completed, user.total)} complete</small>
            </span>
            <span>{dateTime(user.last_updated_at)}</span>
            <span>
              <button className="ghost compact" type="button" onClick={() => downloadCsv(user.user_key)}>
                Download CSV
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function percentage(completed, total) {
  if (!total) return '0%';
  return `${Math.round((completed / total) * 100)}%`;
}

function dateTime(value) {
  if (!value) return 'n/a';
  return new Date(value).toLocaleString();
}
