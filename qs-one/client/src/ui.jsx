import React, { createContext, useContext, useEffect, useRef } from 'react';

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export const DOMAIN_ICON = { mobility: '⇄', institutions: '◆', skills: '↗', innovation: '✦' };

export function fmtDate(iso, opts = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: opts.year === false ? undefined : 'numeric' });
}
export function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function ago(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)} days ago`;
  return fmtDate(iso);
}
export function until(iso) {
  const d = Math.ceil((Date.parse(iso) - Date.now()) / 864e5);
  if (d < 0) return 'past';
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}
export const initials = n => String(n || '?').replace(/^(Prof\.|Dr)\s+/, '').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

export function Avatar({ name, kind, size = 34 }) {
  return <span className={`avatar ${kind || ''}`} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">{initials(name)}</span>;
}

export function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

const TRUST = {
  'QS Evidence': { tone: 'evidence', tip: 'Published QS research or data, linked to its source.' },
  'QS Analysis': { tone: 'analysis', tip: 'Interpretation by the QS One editorial team.' },
  'Member Practice': { tone: 'member', tip: 'Written by a verified member. Not endorsed by QS.' },
  Question: { tone: 'member', tip: 'A question from a verified member.' },
  Pulse: { tone: 'pulse', tip: 'Aggregated member data with cohort size and date.' },
  Partner: { tone: 'partner', tip: 'Paid or partner-authored. Editorially separate from QS.' }
};
export function Trust({ label }) {
  const t = TRUST[label] || { tone: '', tip: '' };
  return <span className={`trust ${t.tone}`} title={t.tip}>{label}</span>;
}

export function DomainTags({ ids = [] }) {
  const { boot } = useApp();
  return <>{ids.map(id => <Tag key={id}>{boot.domains.find(d => d.id === id)?.short || id}</Tag>)}</>;
}

export function SourceBadge({ status, asOf }) {
  if (status === 'live') return <span className="src-badge live" title="Read from qs.com by the QS One source service">● Live from qs.com · {ago(asOf)}</span>;
  if (status === 'stale') return <span className="src-badge stale" title="The last refresh failed; showing the most recent successful read">● Last read {fmtDate(asOf)} · refresh failed</span>;
  return <span className="src-badge saved" title="Saved summary used because the live page could not be read">○ Saved copy · {fmtDate(asOf)}</span>;
}

export function PageHead({ eyebrow, title, intro, children }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Section({ title, sub, action, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }) { return <div className="empty">{children}</div>; }
export function Note({ children, tone = '' }) { return <div className={`note ${tone}`}>{children}</div>; }

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input,textarea,select,button')?.focus();
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">×</button></div>
        {children}
      </section>
    </div>
  );
}

export function Bars({ options, highlight = [] }) {
  return (
    <div className="bars">
      {options.map(o => (
        <div className={`bar-row ${highlight.includes(o.option) ? 'mine' : ''}`} key={o.option}>
          <span className="bar-label">{o.option}{highlight.includes(o.option) && <em> · you</em>}</span>
          <span className="bar-track"><i style={{ width: `${o.pct}%` }} /></span>
          <span className="bar-val">{o.pct}%</span>
        </div>
      ))}
    </div>
  );
}

export function Link({ to, children, className = 'text-link', ...rest }) {
  return <a href={`#/${to}`} className={className} {...rest}>{children}</a>;
}

export function Ext({ href, children = 'Open on qs.com ↗', className = 'text-link' }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}
