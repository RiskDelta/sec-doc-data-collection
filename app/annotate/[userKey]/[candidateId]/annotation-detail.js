'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const confidenceOptions = ['high', 'medium', 'low'];
const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' }
];
const labelDescriptions = {
  addition: 'New text introduces a risk and old text is empty or not a real match.',
  removal: 'Old text contains a risk and new text is empty or no longer has a real match.',
  actualization: 'A risk moves from possible or hypothetical to realized or active.',
  severity_increase: 'The same risk becomes more severe, more likely, or more direct.',
  severity_decrease: 'The same risk becomes less severe, less likely, more limited, or less direct.',
  specificity_increase: 'New text adds concrete details such as lawsuits, fines, countries, dates, products, business lines, or consequences.',
  specificity_decrease: 'New text removes concrete details, replacing them with broader or less specific risk language.',
  neutral: 'Meaning is unchanged between the old and new text.',
  unclear: 'Extraction is broken, the pair is not comparable, or the label is too ambiguous.'
};

export default function AnnotationDetail({ userKey, candidateId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const status = parseStatus(searchParams.get('status'));
  const [row, setRow] = useState(null);
  const [sidebarPayload, setSidebarPayload] = useState({ rows: [], total: 0, total_pages: 1 });
  const [labels, setLabels] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRow();
  }, [userKey, candidateId]);

  useEffect(() => {
    loadSidebar(page, status);
  }, [page, status, userKey]);

  async function loadRow() {
    const password = window.sessionStorage.getItem(`riskdelta-password:${userKey}`);
    if (!password) {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    setError('');
    const response = await fetch(
      `/api/users/${encodeURIComponent(userKey)}/rows/${encodeURIComponent(candidateId)}`,
      { headers: { 'x-user-password': password } }
    );
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || 'Could not load row.');
      return;
    }

    setRow(payload.row);
    setLabels(payload.labels || []);
    setForm({
      primary_label: payload.row.primary_label || '',
      secondary_label: payload.row.secondary_label || '',
      rationale_old: payload.row.rationale_old || '',
      rationale_new: payload.row.rationale_new || '',
      confidence: payload.row.confidence || '',
      notes: payload.row.notes || ''
    });
  }

  async function loadSidebar(nextPage, nextStatus) {
    const password = window.sessionStorage.getItem(`riskdelta-password:${userKey}`);
    if (!password) {
      window.location.href = '/';
      return;
    }

    setSidebarLoading(true);
    const query = new URLSearchParams({
      page: String(nextPage),
      status: nextStatus
    });
    const response = await fetch(
      `/api/users/${encodeURIComponent(userKey)}/rows?${query.toString()}`,
      { headers: { 'x-user-password': password } }
    );
    const payload = await response.json();
    setSidebarLoading(false);

    if (!response.ok) {
      setError(payload.error || 'Could not load navigation.');
      return;
    }

    setSidebarPayload(payload);
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateQuery(nextValues) {
    const nextPage = nextValues.page || page;
    const nextStatus = nextValues.status || status;
    const query = new URLSearchParams({
      page: String(nextPage),
      status: nextStatus
    });
    router.replace(
      `/annotate/${encodeURIComponent(userKey)}/${encodeURIComponent(candidateId)}?${query.toString()}`
    );
  }

  function detailHref(nextCandidateId, nextPage = page, nextStatus = status) {
    return `/annotate/${encodeURIComponent(userKey)}/${encodeURIComponent(nextCandidateId)}?page=${nextPage}&status=${nextStatus}`;
  }

  async function save({ goNext = false, overrides = {} } = {}) {
    const password = window.sessionStorage.getItem(`riskdelta-password:${userKey}`);
    if (!password) {
      window.location.href = '/';
      return;
    }

    const body = { ...form, ...overrides };
    setSaving(true);
    setError('');

    const response = await fetch(
      `/api/users/${encodeURIComponent(userKey)}/rows/${encodeURIComponent(candidateId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-password': password
        },
        body: JSON.stringify(body)
      }
    );
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || 'Could not save annotation.');
      return;
    }

    if (goNext && payload.next_candidate_id) {
      router.push(detailHref(payload.next_candidate_id));
      return;
    }

    router.push(`/annotate/${encodeURIComponent(userKey)}?page=${page}&status=${status}`);
  }

  function markUnclear() {
    save({
      goNext: true,
      overrides: {
        primary_label: 'unclear',
        confidence: 'low',
        notes: form.notes || 'ambiguous'
      }
    });
  }

  return (
    <main className="shell detailShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">RiskDelta / {userKey}</p>
          <h1>{candidateId}</h1>
        </div>
        <Link className="backLink" href={`/annotate/${encodeURIComponent(userKey)}?page=${page}&status=${status}`}>
          Back to rows
        </Link>
      </header>

      {loading ? <section className="panel centered">Loading...</section> : null}
      {error ? <section className="notice error">{error}</section> : null}

      {row ? (
        <div className="detailLayout">
          <aside className="panel navSidebar" aria-label="Candidate navigation">
            <div className="sidebarHeader">
              <div>
                <h2>Candidates</h2>
                <p>{sidebarPayload.total || 0} rows</p>
              </div>
              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => updateQuery({ page: 1, status: event.target.value })}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sidebarLoading ? <p className="muted">Loading...</p> : null}
            {!sidebarLoading && sidebarPayload.rows.length === 0 ? (
              <p className="muted">No rows found.</p>
            ) : null}

            <div className="sidebarList">
              {sidebarPayload.rows.map((item) => (
                <Link
                  className={`sidebarItem${item.candidate_id === candidateId ? ' active' : ''}`}
                  href={detailHref(item.candidate_id, sidebarPayload.page || page, status)}
                  key={item.candidate_id}
                >
                  <span>
                    <strong>{item.candidate_id}</strong>
                    <small>{item.ticker || 'Unknown'} · sim {formatNumber(item.similarity_score)}</small>
                  </span>
                  <span className={item.completed ? 'status done' : 'status pending'}>
                    {item.completed ? 'Completed' : 'Open'}
                  </span>
                </Link>
              ))}
            </div>

            <nav className="pager sidebarPager">
              <button
                className="ghost"
                disabled={page <= 1 || sidebarLoading}
                onClick={() => updateQuery({ page: Math.max(page - 1, 1) })}
                type="button"
              >
                Previous
              </button>
              <span>Page {sidebarPayload.page || page} of {sidebarPayload.total_pages || 1}</span>
              <button
                className="ghost"
                disabled={page >= (sidebarPayload.total_pages || 1) || sidebarLoading}
                onClick={() => updateQuery({ page: page + 1 })}
                type="button"
              >
                Next
              </button>
            </nav>
          </aside>

          <div className="detailMain">
            <div className="meta">
              <span>{row.completed ? 'Completed' : 'Open'}</span>
              <span>{row.ticker}</span>
              <span>{dateOnly(row.old_filing_date)} -&gt; {dateOnly(row.new_filing_date)}</span>
              <span>{row.candidate_source}</span>
              <span>sim {formatNumber(row.similarity_score)}</span>
            </div>

            <section className="textGrid">
              <article className="textPane">
                <h2>Old text</h2>
                <p>{row.old_text || '[empty]'}</p>
              </article>
              <article className="textPane">
                <h2>New text</h2>
                <p>{row.new_text || '[empty]'}</p>
              </article>
            </section>

            <form
              className="panel formGrid"
              onSubmit={(event) => {
                event.preventDefault();
                save({ goNext: false });
              }}
            >
              <fieldset>
                <legend>Primary label</legend>
                <div className="labelGrid">
                  {labels.map((label) => (
                    <Choice
                      key={label}
                      name="primary_label"
                      value={label}
                      checked={form.primary_label === label}
                      required
                      onChange={updateField}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Secondary label</legend>
                <div className="labelGrid">
                  <Choice
                    name="secondary_label"
                    value=""
                    label="None"
                    checked={form.secondary_label === ''}
                    onChange={updateField}
                  />
                  {labels.map((label) => (
                    <Choice
                      key={label}
                      name="secondary_label"
                      value={label}
                      checked={form.secondary_label === label}
                      onChange={updateField}
                    />
                  ))}
                </div>
              </fieldset>

              <label>
                Rationale old
                <textarea
                  rows="2"
                  value={form.rationale_old}
                  placeholder="Short quote or phrase from old text"
                  onChange={(event) => updateField('rationale_old', event.target.value)}
                />
              </label>
              <label>
                Rationale new
                <textarea
                  rows="2"
                  value={form.rationale_new}
                  placeholder="Short quote or phrase from new text"
                  onChange={(event) => updateField('rationale_new', event.target.value)}
                />
              </label>

              <label>
                Confidence
                <select
                  value={form.confidence}
                  onChange={(event) => updateField('confidence', event.target.value)}
                >
                  <option value="">Select</option>
                  {confidenceOptions.map((confidence) => (
                    <option key={confidence} value={confidence}>
                      {titleCase(confidence)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  rows="2"
                  value={form.notes}
                  placeholder="Optional"
                  onChange={(event) => updateField('notes', event.target.value)}
                />
              </label>

              <div className="actions">
                <button type="button" className="ghost" disabled={saving} onClick={markUnclear}>
                  Mark unclear and next
                </button>
                <button disabled={saving} type="submit">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button disabled={saving} type="button" onClick={() => save({ goNext: true })}>
                  {saving ? 'Saving...' : 'Save and next'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Choice({ name, value, label, checked, required = false, onChange }) {
  const description = labelDescriptions[value];

  return (
    <div className="choiceShell">
      <label className="choice">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
        />
        <span>{label || value.replaceAll('_', ' ')}</span>
      </label>
      {description ? (
        <button
          type="button"
          className="infoButton"
          title={description}
          data-tooltip={description}
          aria-label={`${value.replaceAll('_', ' ')} definition: ${description}`}
        >
          i
        </button>
      ) : null}
    </div>
  );
}

function emptyForm() {
  return {
    primary_label: '',
    secondary_label: '',
    rationale_old: '',
    rationale_new: '',
    confidence: '',
    notes: ''
  };
}

function parsePage(value) {
  const page = Number(value || 1);
  return Number.isFinite(page) ? Math.max(Math.floor(page), 1) : 1;
}

function parseStatus(value) {
  return statusOptions.some((option) => option.value === value) ? value : 'all';
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : 'n/a';
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
