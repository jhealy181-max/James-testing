import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Trust, Tag, Lock, Link, Ext, SourceBadge, Empty, fmtDate, fmtDateTime, until, ago } from '../ui.jsx';

const dname = (boot, id) => boot.domains.find(d => d.id === id)?.short || id;

export function IntelCard({ item }) {
  const { boot } = useApp();
  const isIntel = item.itemType === 'intel';
  return (
    <article className={`card ${item.locked ? 'locked-card' : ''}`}>
      <div className="card-top"><Trust label={item.label} /><span>{item.kind}</span><span>· {fmtDate(item.published)}</span></div>
      <h3>{isIntel && !item.locked ? <Link to={`intelligence/${item.id}`} className="">{item.title}</Link> : isIntel ? item.title : <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>}</h3>
      <p>{item.summary}</p>
      {!isIntel && item.excerpts?.[0] && <div className="excerpt">“{item.excerpts[0]}”</div>}
      <div className="card-top">{item.domains.map(d => <Tag key={d}>{dname(boot, d)}</Tag>)}</div>
      <div className="card-foot">
        {isIntel ? (item.locked ? <Lock>Included from {item.accessLabel}</Lock> : <Tag tone={item.access === 'free' ? 'green' : 'blue'}>{item.accessLabel}</Tag>) : <SourceBadge status={item.status} asOf={item.asOf} />}
        {isIntel ? (item.locked ? <Link to="membership/plans">See plans</Link> : <Link to={`intelligence/${item.id}`}>Read</Link>) : <Ext href={item.url} />}
      </div>
      {item.reasons && <div className="why">Why you see this: {item.reasons.join(' · ')}</div>}
    </article>
  );
}

export function Intelligence() {
  const { boot, ent } = useApp();
  const [items, setItems] = useState(null);
  const [domain, setDomain] = useState('all');
  const [kind, setKind] = useState('all');
  useEffect(() => { api('intel').then(d => setItems(d.items)); }, []);
  const kinds = ['Signal', 'Monthly briefing', 'Executive-team briefing', 'Private executive briefing', 'QS Evidence'];
  const shown = useMemo(() => (items || []).filter(i => (domain === 'all' || i.domains.includes(domain)) && (kind === 'all' || (kind === 'QS Evidence' ? i.itemType !== 'intel' : i.kind === kind))), [items, domain, kind]);
  return (
    <>
      <PageTitle title="Intelligence" lede="Executive-ready interpretation of QS data, Pulse results and expert views. Every item shows who produced it, when, and the QS sources behind it." />
      <Panel title="Signals & briefings" action={null}>
        <div className="notice left">Weekly Signal: free for every institution. Monthly domain briefings and closed-door webinars: Member. Quarterly executive-team briefing: Member Plus. Private executive briefings: Council. Your plan: <b>{ent.label}</b>.</div>
        <div style={{ height: 20 }} />
        <div className="filters">
          <label className="field"><span>Domain</span><select className="select" value={domain} onChange={e => setDomain(e.target.value)}><option value="all">All domains</option>{boot.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label className="field"><span>Format</span><select className="select" value={kind} onChange={e => setKind(e.target.value)}><option value="all">All formats</option>{kinds.map(k => <option key={k}>{k}</option>)}</select></label>
        </div>
        {!items ? <p className="muted">Loading…</p> : shown.length ? <div className="grid g3">{shown.map(i => <IntelCard key={i.id} item={i} />)}</div> : <Empty>Nothing matches these filters.</Empty>}
      </Panel>
    </>
  );
}

export function Briefing({ id }) {
  const { boot } = useApp();
  const [b, setB] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`intel/${id}`).then(setB).catch(e => setErr(e.message)); }, [id]);
  if (err) return <><Link to="intelligence" className="back">← Intelligence</Link><div className="lock-panel" style={{ marginTop: 24 }}><strong>🔒 {err}</strong><Link to="membership/plans" className="btn amber">See plans</Link></div></>;
  if (!b) return <p className="muted">Loading…</p>;
  return (
    <>
      <Link to="intelligence" className="back">← Intelligence</Link>
      <PageTitle title={b.title} lede={b.summary} />
      <div className="two-col">
        <Panel action={null}>
          <div className="card-top" style={{ marginBottom: 16 }}><Trust label={b.label} /><span>{b.kind}</span><span>· {fmtDate(b.published)}</span>{b.domains.map(d => <Tag key={d}>{dname(boot, d)}</Tag>)}<Tag>Illustrative editorial</Tag></div>
          <div className="reader-body">{(b.body || [b.summary, 'Illustrative editorial for the proof of concept. A published item would contain the evidence, analysis and implications with links to underlying sources.']).map((p, n) => <p key={n}>{p}</p>)}</div>
        </Panel>
        <div className="grid">
          {b.soWhat && <div className="callout"><div className="kicker">So what</div><p>{b.soWhat}</p></div>}
          {b.action && <div className="callout blue"><div className="kicker">Suggested action</div><p>{b.action}</p></div>}
          <Panel small title="QS sources" action={null}>
            {b.sources.map(s => <div className="row" key={s.id}><span><Ext href={s.url}>{s.title} ↗</Ext><span className="meta"><SourceBadge status={s.status} asOf={s.asOf} /></span></span></div>)}
          </Panel>
        </div>
      </div>
    </>
  );
}

export function Webinars() {
  const { boot, toast } = useApp();
  const [items, setItems] = useState(null);
  const load = () => api('webinars').then(d => setItems(d.items));
  useEffect(() => { load(); }, []);
  async function reg(w) { try { const r = await api(`webinars/${w.id}/register`, { method: 'POST' }); toast(r.registered ? 'Registered. (Demo: no calendar invite is sent.)' : 'Registration cancelled.'); load(); } catch (e) { toast(e.message, true); } }
  return (
    <>
      <PageTitle title="Closed-door expert webinars" lede="Experts speaking off the record, for members only. Sponsored sessions are labelled." />
      <Panel title="Upcoming" action={null}>
        {!items ? <p className="muted">Loading…</p> : <div className="grid g3">{items.map(w => (
          <article className={`card ${w.locked ? 'locked-card' : ''}`} key={w.id}>
            <div className="card-top">{w.domains.map(d => <Tag key={d}>{dname(boot, d)}</Tag>)}{w.sponsor && <Trust label="Partner" />}</div>
            <h3>{w.title}</h3>
            <p>{w.speaker}{w.sponsor ? ` · sponsored by ${w.sponsor}` : ''}</p>
            <p className="meta">{fmtDateTime(w.at)} · {until(w.at)} · {w.count} registered</p>
            <div className="card-foot">{w.locked ? <><Lock>Included from {w.accessLabel}</Lock><Link to="membership/plans">See plans</Link></> : <><Tag tone="blue">{w.accessLabel}</Tag><button className={`btn sm ${w.registered ? 'ghost' : 'amber'}`} onClick={() => reg(w)}>{w.registered ? 'Cancel' : 'Register'}</button></>}</div>
          </article>
        ))}</div>}
      </Panel>
    </>
  );
}

export function Library() {
  const { boot } = useApp();
  const [items, setItems] = useState(null);
  const [kind, setKind] = useState('all');
  useEffect(() => { api('library').then(d => setItems(d.items)); }, []);
  const shown = (items || []).filter(i => kind === 'all' || i.kind === kind);
  return (
    <>
      <PageTitle title="Case studies & frameworks" lede="Usable tools and precedents from QS and from members. Free members can use part of the library." />
      <Panel title="Library" action={null}>
        <div className="filters"><div className="seg" role="group">{['all', 'Framework', 'Case study'].map(k => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k === 'all' ? 'All' : k === 'Framework' ? 'Frameworks' : 'Case studies'}</button>)}</div></div>
        {!items ? <p className="muted">Loading…</p> : <div className="grid g3">{shown.map(l => (
          <article className={`card ${l.locked ? 'locked-card' : ''}`} key={l.id}>
            <div className="card-top"><Tag tone="amber">{l.kind}</Tag>{l.member && <Trust label="Member practice" />}{l.domains.map(d => <Tag key={d}>{dname(boot, d)}</Tag>)}</div>
            <h3>{l.title}</h3><p>{l.summary}</p>
            <div className="card-foot">{l.locked ? <><Lock>Included from {l.accessLabel}</Lock><Link to="membership/plans">See plans</Link></> : <><Tag tone="green">{l.accessLabel === 'Free' ? 'Free' : l.accessLabel}</Tag>{l.url ? <Ext href={l.url} /> : <span className="meta">Download (demo)</span>}</>}</div>
          </article>
        ))}</div>}
      </Panel>
    </>
  );
}

export function Sources() {
  const { boot, toast } = useApp();
  const [d, setD] = useState(null);
  const load = () => api('sources').then(setD);
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!d?.status.running) return; const t = setInterval(load, 3000); return () => clearInterval(t); }, [d?.status.running]);
  async function refreshNow() { try { const r = await api('sources/refresh', { method: 'POST' }); toast(r.message, !r.started); load(); } catch (e) { toast(e.message, true); } }
  if (!d) return <p className="muted">Loading…</p>;
  const live = d.sources.filter(s => s.status === 'live').length;
  return (
    <>
      <PageTitle title="QS data sources" lede="QS One reads public qs.com pages, keeps short excerpts with a link back, and records when each was read. If a page cannot be read, it shows a saved copy and says so." />
      <Panel title="Source status" action={<button className="btn amber" onClick={refreshNow} disabled={d.status.running}>{d.status.running ? 'Refreshing…' : 'Refresh from qs.com'}</button>}>
        <div className="tiles">
          <div className="tile"><span className="t-label">Read live</span><span className="t-val">{live}/{d.sources.length}</span></div>
          <div className="tile"><span className="t-label">Last refresh</span><span className="t-val" style={{ fontSize: 28 }}>{d.status.lastRun ? ago(d.status.lastRun.finished) : 'Not yet'}</span></div>
          <div className="tile"><span className="t-label">Schedule</span><span className="t-val" style={{ fontSize: 28 }}>Every {d.status.refreshHours} h</span></div>
          <div className="tile"><span className="t-label">Saved copies dated</span><span className="t-val" style={{ fontSize: 28 }}>{fmtDate(d.status.snapshotDate)}</span></div>
        </div>
        {d.status.live && live === 0 && !d.status.running && <><div style={{ height: 16 }} /><div className="notice left">No pages read live yet. If this persists, the server may lack internet access or qs.com may be refusing automated requests. Saved copies are shown meanwhile.</div></>}
        <div style={{ height: 20 }} />
        <div className="scroll"><table className="table"><thead><tr><th>Source</th><th>Domain</th><th>Status</th><th>Notes</th></tr></thead><tbody>
          {d.sources.map(s => <tr key={s.id}><td><strong>{s.title}</strong><div><Ext href={s.url}>{s.url.replace('https://www.', '')}</Ext></div></td><td>{boot.domains.find(x => x.id === s.domain)?.short || 'Events'}</td><td><SourceBadge status={s.status} asOf={s.asOf} /></td><td className="meta">{s.lastError ? `Last attempt: ${s.lastError}` : s.status === 'live' ? `${s.excerpts.length} excerpts` : 'Saved summary'}</td></tr>)}
        </tbody></table></div>
      </Panel>
    </>
  );
}
