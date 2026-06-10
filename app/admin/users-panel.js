'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

      setUsers(payload.users || []);
    }

    loadUsers();
  }, []);

  if (loading) {
    return <section className="panel muted">Loading users...</section>;
  }

  if (error) {
    return <section className="notice error">{error}</section>;
  }

  return (
    <section className="panel listPanel">
      <div className="listHeader users">
        <span>User</span>
        <span>Password</span>
        <span>Progress</span>
        <span>Updated</span>
      </div>

      {users.length === 0 ? <p className="emptyList muted">No uploaded user data yet.</p> : null}

      <div className="rowList">
        {users.map((user) => (
          <Link
            className="rowItem users"
            href={`/annotate/${encodeURIComponent(user.user_key)}`}
            key={user.user_key}
            onClick={() => {
              window.sessionStorage.setItem(`riskdelta-password:${user.user_key}`, user.password);
            }}
          >
            <span>
              <strong>{user.user_key}</strong>
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
          </Link>
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
