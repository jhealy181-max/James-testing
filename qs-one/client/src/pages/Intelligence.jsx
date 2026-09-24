import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Trust, DomainTags, SourceBadge, Link, Ext, Empty, fmtDate, Note, Tag } from '../ui.jsx';

export function FeedCard({ item, compact }) {
  const isBrief = item.itemType === 'briefing';
  return (
    <article className="card feed-card">
      <div className="feed-top"><Trust label={item.label} /><span className="kind">{item.kind}</span></div>
      <h3>{isBrief ? <Link to={`intelligence/${item.id}`} className="plain">{item.title}</Link> : <a className="plain" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>}</h3>
      <p>{item.summary}</p>
      {isBrief && item.soWhat && !compact && <p className="so-what"><b>So what:</b> {item.soWhat}</p>}
      {!isBrief && item.excerpts?.length > 0 && !compact && <blockquote className="excerpt">“{item.excerpts[0]}”</blockquote>}
      <div className="tags"><DomainTags ids={item.domains} />{item.sample && <Tag tone="gray">Illustrative editorial</Tag>}</div>
      <div className="feed-foot">
        {isBrief ? <span className="meta">{fmtDate(item.published)}{item.sources?.length ? ` · ${item.sources.length} QS source${item.sources.length > 1 ? 's' : ''}` : ''}</span> : <SourceBadge status={item.status} asOf={item.asOf} />}
        {isBrief ? <Link to={`intelligence/${item.id}`}>Read →</Link> : <Ext href={item.url} />}
      </div>
      {item.reasons && <div className="why" title="Why you are seeing this">Why: {item.reasons.join(' · ')}</div>}
    </article>
  );
}

export default function Intelligence() {
  const { boot } = useApp();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('all');
  const [label, setLabel] = useState('all');
  useEffect(() => { api('feed').then(d => setItems(d.items)); }, []);
  const shown = useMemo(() => (items || []).filter(i =>
    (domain === 'all' || i.domains.includes(domain)) &&
    (label === 'all' || (label === 'briefing' ? i.itemType === 'briefing' : i.itemType !== 'briefing')) &&
    (!q || `${i.title} ${i.summary}`.toLowerCase().includes(q.toLowerCase()))), [items, q, domain, label]);
  const liveCount = (items || []).filter(i => i.itemType !== 'briefing' && i.status === 'live').length;

  return (
    <>
      <PageHead eyebrow="Intelligence" title="Your intelligence" intro="QS analysis and QS evidence ranked for your role. Every item says who produced it, when, and why it is in your list." />
      <Note tone="info"><b>{liveCount}</b> QS source items were read live from qs.com; the rest are saved copies. <Link to="sources">See source status →</Link></Note>
      <div className="filters">
        <input type="search" placeholder="Search titles and summaries" value={q} onChange={e => setQ(e.target.value)} aria-label="Search intelligence" id="intel-search" />
        <select value={domain} onChange={e => setDomain(e.target.value)} aria-label="Domain" id="intel-domain">
          <option value="all">All domains</option>
          {boot.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="seg" role="group" aria-label="Content type">
          {[['all', 'All'], ['briefing', 'QS Analysis'], ['evidence', 'QS Evidence']].map(([v, l]) => <button key={v} className={label === v ? 'on' : ''} onClick={() => setLabel(v)}>{l}</button>)}
        </div>
      </div>
      {!items ? <p className="muted">Loading…</p> : shown.length ? <div className="grid three">{shown.map(i => <FeedCard key={i.id} item={i} />)}</div> : <Empty>No items match. Clear the search or choose another domain.</Empty>}
    </>
  );
}

export function Briefing({ id }) {
  const [b, setB] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`briefings/${id}`).then(setB).catch(e => setErr(e.message)); }, [id]);
  if (err) return <Empty>{err} <Link to="intelligence">Back to intelligence</Link></Empty>;
  if (!b) return <p className="muted">Loading…</p>;
  return (
    <article className="reader">
      <Link to="intelligence">← Intelligence</Link>
      <div className="reader-top"><Trust label={b.label} /><span className="kind">{b.kind}</span><span className="meta">{fmtDate(b.published)}</span>{b.sample && <Tag tone="gray">Illustrative editorial</Tag>}</div>
      <h1 className="serif">{b.title}</h1>
      <p className="lede">{b.summary}</p>
      <div className="reader-grid">
        <div className="reader-body">{b.body.map((p, n) => <p key={n}>{p}</p>)}</div>
        <aside className="reader-side">
          {b.soWhat && <div className="callout"><div className="card-kicker">So what</div><p>{b.soWhat}</p></div>}
          {b.action && <div className="callout action"><div className="card-kicker">Suggested action</div><p>{b.action}</p></div>}
          <div className="card-kicker" style={{ marginTop: 18 }}>QS sources</div>
          {b.sources.map(s => (
            <div className="source-line" key={s.id}>
              <Ext href={s.url}>{s.title} ↗</Ext>
              <SourceBadge status={s.status} asOf={s.asOf} />
            </div>
          ))}
          <div className="tags" style={{ marginTop: 14 }}><DomainTags ids={b.domains} /></div>
        </aside>
      </div>
    </article>
  );
}
