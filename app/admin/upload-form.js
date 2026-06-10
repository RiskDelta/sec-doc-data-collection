'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState(generatePassword());

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus({ type: 'info', message: 'Uploading CSV...' });

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-admin-password': window.sessionStorage.getItem('riskdelta-admin-password') || ''
      },
      body: new FormData(event.currentTarget)
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus({ type: 'error', message: payload.error || 'Upload failed.' });
      return;
    }

    setStatus({
      type: 'success',
      message: `${payload.inserted} inserted, ${payload.updated} updated. Password: ${payload.password}`,
      href: payload.annotation_url
    });
  }

  return (
    <>
      <form className="panel stack" onSubmit={handleSubmit}>
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
        <label>
          CSV batch
          <input name="csv" type="file" accept=".csv,text/csv" required />
        </label>
        <button disabled={busy} type="submit">
          {busy ? 'Uploading...' : 'Upload CSV'}
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
