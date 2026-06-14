'use client';

import { useEffect, useMemo, useState } from 'react';

export default function UploadForm() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('existing');
  const [password, setPassword] = useState(generatePassword());
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [selectedUserKey, setSelectedUserKey] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const hasUsers = users.length > 0;
  const activeMode = hasUsers ? mode : 'create';
  const selectedUser = useMemo(
    () => users.find((user) => user.user_key === selectedUserKey),
    [selectedUserKey, users]
  );

  async function loadUsers() {
    const response = await fetch('/api/admin/users', {
      headers: {
        'x-admin-password': window.sessionStorage.getItem('riskdelta-admin-password') || ''
      }
    });
    const payload = await response.json();

    if (!response.ok) {
      setUsersError(payload.error || 'Could not load existing accounts.');
      return;
    }

    const nextUsers = payload.users || [];
    setUsers(nextUsers);
    setSelectedUserKey((current) => current || nextUsers[0]?.user_key || '');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setStatus({ type: 'info', message: 'Uploading CSV...' });

    const formData = new FormData(form);
    formData.set('account_mode', activeMode);
    if (activeMode === 'existing') {
      formData.set('user_key', selectedUserKey);
      formData.delete('password');
    }

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-admin-password': window.sessionStorage.getItem('riskdelta-admin-password') || ''
      },
      body: formData
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus({ type: 'error', message: payload.error || 'Upload failed.' });
      return;
    }

    await loadUsers();
    window.dispatchEvent(new Event('riskdelta-users-updated'));
    setStatus({
      type: 'success',
      message: uploadMessage(payload),
      href: payload.annotation_url
    });
    form.reset();
  }

  return (
    <>
      <form className="panel stack" onSubmit={handleSubmit}>
        <fieldset className="segmentedField">
          <legend>Destination</legend>
          <div className="segmentedControl">
            <label className={!hasUsers ? 'disabled' : ''}>
              <input
                type="radio"
                name="mode_toggle"
                value="existing"
                checked={activeMode === 'existing'}
                disabled={!hasUsers}
                onChange={() => setMode('existing')}
              />
              <span>Add to existing</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode_toggle"
                value="create"
                checked={activeMode === 'create'}
                onChange={() => setMode('create')}
              />
              <span>Create account</span>
            </label>
          </div>
        </fieldset>

        {activeMode === 'existing' ? (
          <>
            <label>
              Existing account
              <select
                name="user_key"
                required
                value={selectedUserKey}
                onChange={(event) => setSelectedUserKey(event.target.value)}
              >
                {users.map((user) => (
                  <option key={user.user_key} value={user.user_key}>
                    {user.user_key} ({user.open} open / {user.total} total)
                  </option>
                ))}
              </select>
            </label>
            {selectedUser ? (
              <div className="accountSummary">
                <span>
                  <strong>{selectedUser.total}</strong>
                  total rows
                </span>
                <span>
                  <strong>{selectedUser.open}</strong>
                  open
                </span>
                <span>
                  <strong>{selectedUser.completed}</strong>
                  complete
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <label>
              User key
              <input name="user_key" placeholder="annotator-a" required />
            </label>
            <label>
              Password
              <span className="inlineField">
                <input
                  name="password"
                  value={password}
                  required
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="button" className="ghost compact" onClick={() => setPassword(generatePassword())}>
                  Generate
                </button>
              </span>
            </label>
          </>
        )}

        {usersError ? <p className="fieldNote error">{usersError}</p> : null}

        <label>
          CSV batch
          <input name="csv" type="file" accept=".csv,text/csv" required />
        </label>
        <button disabled={busy} type="submit">
          {busy ? 'Uploading...' : activeMode === 'existing' ? 'Upload to account' : 'Create and upload'}
        </button>
      </form>

      {status ? (
        <section className={`notice ${status.type}`}>
          <p>{status.message}</p>
          {status.href ? <a href={status.href}>Open user queue</a> : null}
        </section>
      ) : null}
    </>
  );
}

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let output = '';
  for (let index = 0; index < 10; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

function uploadMessage(payload) {
  const pieces = [
    `${payload.inserted} new rows`,
    `${payload.updated} updated rows`
  ];

  if (payload.skipped) {
    pieces.push(`${payload.skipped} skipped`);
  }

  const prefix = payload.account_action === 'created'
    ? `Created ${payload.user_key}. Password: ${payload.password}.`
    : `Added data to ${payload.user_key}. Password unchanged.`;

  return `${prefix} ${pieces.join(', ')}.`;
}
