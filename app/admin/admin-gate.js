'use client';

import { useState } from 'react';

export default function AdminGate({ children }) {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.sessionStorage.getItem('riskdelta-admin-password'));
  });

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) return;
    window.sessionStorage.setItem('riskdelta-admin-password', trimmed);
    setUnlocked(true);
  }

  if (unlocked) {
    return children;
  }

  return (
    <main className="shell narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">RiskDelta Admin</p>
          <h1>Admin access</h1>
        </div>
        <a className="backLink" href="/">User access</a>
      </header>

      <form className="panel stack" onSubmit={handleSubmit}>
        <label>
          Admin password
          <input
            value={password}
            type="password"
            autoComplete="current-password"
            required
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit">Continue</button>
      </form>
    </main>
  );
}
