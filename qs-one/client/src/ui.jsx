import React, { createContext, useContext, useEffect, useRef } from 'react';

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function fmtDate(iso, opts = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: opts.year === false ? undefined : 'numeric' });
}
export const fmtDateTime = iso => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtNumDate = iso => new Date(iso).toLocaleDateString('en-GB');
export function ago(iso) {
  if (!iso) return 'never';
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
export const signed = (v, unit = '') => (v == null ? '–' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}${unit}`);
export const usd = n => (n === 0 ? 'Free' : `$${Math.round(n / 1000)}k`);

export function Av({ name, kind, me }) { return <span className={`av ${kind === 'partner' ? 'partner' : ''} ${me ? 'me' : ''}`} aria-hidden="true">{initials(name)}</span>; }
export function Tag({ children, tone = '' }) { return <span className={`tag ${tone}`}>{children}</span>; }
export function Info({ tip }) { return <i className="info-dot" title={tip} aria-label={tip}>i</i>; }
export function Lock({ children }) { return <span className="lock">🔒 {children}</span>; }

const TRUST = { 'QS Evidence': 'evidence', 'QS Analysis': 'analysis', 'Member practice': 'member', Partner: 'partner' };
export function Trust({ label }) { return <span className={`trust ${TRUST[label] || ''}`}>{label}</span>; }

export function SourceBadge({ status, asOf }) {
  if (status === 'live') return <span className="src-badge live" title="Read from qs.com by the QS One source service">● Live from qs.com · {ago(asOf)}</span>;
  if (status === 'stale') return <span className="src-badge stale">● Last read {fmtDate(asOf)} · refresh failed</span>;
  return <span className="src-badge saved" title="Saved summary used because the live page could not be read">○ Saved copy · {fmtDate(asOf)}</span>;
}

export function PageTitle({ title, lede }) {
  return <><h1 className="page-title">{title}</h1>{lede && <p className="page-lede">{lede}</p>}</>;
}

export function Panel({ title, sub, info, action, children, small }) {
  return (
    <section className="panel">
      {(title || action) && (
        <div className="panel-head">
          <div>{small ? <h3>{title}{info && <Info tip={info} />}</h3> : <h2>{title}</h2>}{sub && <p>{sub}</p>}</div>
          {action ?? <button className="dots" aria-label="More options" title="More options">•••</button>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }) { return <div className="empty">{children}</div>; }

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input,textarea,select,button:not(.x-btn)')?.focus();
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head"><h2>{title}</h2><button className="x-btn" onClick={onClose} aria-label="Close">×</button></div>
        {children}
      </section>
    </div>
  );
}

export function Link({ to, children, className = 'text-link', ...rest }) { return <a href={`#/${to}`} className={className} {...rest}>{children}</a>; }
export function Ext({ href, children = 'Open on qs.com ↗', className = 'text-link' }) { return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>; }

// Horizontal share bars (choice questions)
export function HBars({ options, mine }) {
  return (
    <div className="hbars">
      {options.map(o => (
        <div className={`hbar ${mine === o.option ? 'mine' : ''}`} key={o.option}>
          <span>{o.option}{mine === o.option && <em> · you</em>}</span>
          <span className="track"><i style={{ width: `${o.pct}%` }} /></span>
          <b>{o.pct}%</b>
        </div>
      ))}
    </div>
  );
}

// Grouped vertical bars in the Rankings Preview style: amber = you, grey = peers. Handles negative values.
export function GroupedBars({ categories, series, unit = '', height = 420 }) {
  const all = series.flatMap(s => s.values).filter(v => v != null);
  const rawMax = Math.max(0, ...all), rawMin = Math.min(0, ...all);
  const step = niceStep((rawMax - rawMin) / 5 || 10);
  const max = Math.ceil(rawMax / step) * step || step, min = Math.floor(rawMin / step) * step;
  const W = 1200, H = height, padL = 56, padR = 12, padT = 16, padB = 44;
  const plotH = H - padT - padB, plotW = W - padL - padR;
  const y = v => padT + ((max - v) / (max - min)) * plotH;
  const groupW = plotW / categories.length, barW = Math.min(90, (groupW * 0.72) / series.length), gap = 10;
  const ticks = []; for (let v = min; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(2));
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${series.map(s => s.name).join(' vs ')} by ${categories.join(', ')}`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#9a9a9a' : '#e6e6e6'} strokeWidth={t === 0 ? 1.4 : 1} />
            <text x={padL - 12} y={y(t) + 5} textAnchor="end" fontSize="15" fill="#6b6b6b">{t}{unit}</text>
          </g>
        ))}
        {categories.map((c, i) => {
          const gx = padL + i * groupW + (groupW - (barW * series.length + gap * (series.length - 1))) / 2;
          return (
            <g key={c}>
              {series.map((s, k) => {
                const v = s.values[i]; if (v == null) return null;
                const x = gx + k * (barW + gap); const top = y(Math.max(v, 0)); const h = Math.max(1, Math.abs(y(v) - y(0)));
                const inside = h > 34;
                return (
                  <g key={s.name}>
                    <rect x={x} y={top} width={barW} height={h} fill={s.color}><title>{`${s.name}, ${c}: ${v}${unit}`}</title></rect>
                    <text x={x + barW / 2} y={inside ? top + h / 2 + 5 : v >= 0 ? top - 8 : top + h + 18} textAnchor="middle" fontSize="15" fill="#161616">{v > 0 ? '+' : ''}{v}{unit}</text>
                  </g>
                );
              })}
              <text x={padL + i * groupW + groupW / 2} y={H - 14} textAnchor="middle" fontSize="16" fontWeight="600" fill="#161616">{c}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
function niceStep(raw) { const p = 10 ** Math.floor(Math.log10(raw)); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
