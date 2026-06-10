'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function RowList({ userKey }) {
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ rows: [], total: 0, total_pages: 1 });
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const remaining = Math.max((progress.total || 0) - (progress.completed || 0), 0);
  const percentDone = progress.total ? Math.round(((progress.completed || 0) / progress.total) * 100) : 0;

  useEffect(() => {
    loadPage(page);
  }, [page, userKey]);

  async function loadPage(nextPage) {
    const password = window.sessionStorage.getItem(`riskdelta-password:${userKey}`);
    if (!password) {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    setError('');
    const [rowsResponse, progressResponse] = await Promise.all([
      fetch(`/api/users/${encodeURIComponent(userKey)}/rows?page=${nextPage}`, {
        headers: { 'x-user-password': password }
      }),
      fetch(`/api/users/${encodeURIComponent(userKey)}/progress`, {
        headers: { 'x-user-password': password }
      })
    ]);

    const rowsPayload = await rowsResponse.json();
    const progressPayload = await progressResponse.json();
    setLoading(false);

    if (!rowsResponse.ok) {
      setError(rowsPayload.error || 'Could not load rows.');
      return;
    }

    setPayload(rowsPayload);
    setProgress(progressPayload);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">RiskDelta / {userKey}</p>
          <h1>Annotation rows</h1>
        </div>
        <div className="progress">{progress.completed || 0} / {progress.total || 0}</div>
      </header>

      {error ? <section className="notice error">{error}</section> : null}

      <section className="speedometer panel" aria-label="Annotation progress">
        <div className="speedometerGauge" style={{ '--progress': `${percentDone}%` }}>
          <strong>{percentDone}%</strong>
          <span>done</span>
        </div>
        <div className="speedometerStats">
          <div>
            <strong>{progress.completed || 0}</strong>
            <span>completed</span>
          </div>
          <div>
            <strong>{remaining}</strong>
            <span>to go</span>
          </div>
          <div>
            <strong>{progress.total || 0}</strong>
            <span>total</span>
          </div>
        </div>
      </section>

      <section className="panel listPanel">
        <div className="listHeader">
          <span>Candidate</span>
          <span>Source</span>
          <span>Status</span>
        </div>

        {loading ? <p className="muted">Loading...</p> : null}

        {!loading && payload.rows.length === 0 ? (
          <p className="muted">No rows found for this user.</p>
        ) : null}

        <div className="rowList">
          {payload.rows.map((row) => (
            <Link
              className="rowItem"
              href={`/annotate/${encodeURIComponent(userKey)}/${encodeURIComponent(row.candidate_id)}`}
              key={row.candidate_id}
            >
              <span>
                <strong>{row.candidate_id}</strong>
                <small>{row.ticker || 'Unknown'} · {dateOnly(row.old_filing_date)} -&gt; {dateOnly(row.new_filing_date)}</small>
              </span>
              <span>
                {row.candidate_source || 'n/a'}
                <small>sim {formatNumber(row.similarity_score)}</small>
              </span>
              <span className={row.completed ? 'status done' : 'status pending'}>
                {row.completed ? 'Completed' : 'Open'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="pager">
        <button
          className="ghost"
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(current - 1, 1))}
        >
          Previous
        </button>
        <span>Page {payload.page || page} of {payload.total_pages || 1}</span>
        <button
          className="ghost"
          disabled={page >= (payload.total_pages || 1) || loading}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </nav>
    </main>
  );
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : 'n/a';
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}
