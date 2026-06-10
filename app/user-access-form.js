'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserAccessForm() {
  const router = useRouter();
  const [userKey, setUserKey] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const normalized = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!normalized) return;
    setBusy(true);
    setError('');

    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_key: normalized, password })
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(payload.error || 'Could not sign in.');
      return;
    }

    window.sessionStorage.setItem(`riskdelta-password:${normalized}`, password);
    router.push(`/annotate/${encodeURIComponent(normalized)}`);
  }

  return (
    <form className="panel stack" onSubmit={handleSubmit}>
      <label>
        User ID
        <input
          value={userKey}
          placeholder="annotator-a"
          autoComplete="username"
          required
          onChange={(event) => setUserKey(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          value={password}
          type="password"
          autoComplete="current-password"
          required
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button disabled={busy} type="submit">{busy ? 'Checking...' : 'Continue'}</button>
    </form>
  );
}
