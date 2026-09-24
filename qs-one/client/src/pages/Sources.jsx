import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, SourceBadge, Ext, Note, fmtDate, ago, Empty, Tag } from '../ui.jsx';

export default function Sources() {
  const { boot, toast } = useApp();
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);
  const load = () => api('sources').then(setD);
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!d?.status.running) return; const t = setInterval(load, 3000); return () => clearInterval(t); }, [d?.status.running]);
  async function refreshNow() {
    try { const r = await api('sources/refresh', { method: 'POST' }); toast(r.message, !r.started); load(); } catch (e) { toast(e.message, true); }
  }
  if (!d) return <p className="muted">Loading…</p>;
  const live = d.sources.filter(s => s.status === 'live').length;
  const domainName = id => boot.domains.find(x => x.id === id)?.name || 'Events';
  return (
    <>
      <PageHead eyebrow="Provenance" title="QS data sources" intro="QS One reads public qs.com pages, keeps short excerpts with a link back, and records when each was read. If a page cannot be read, QS One shows a saved copy and says so.">
        <button className="btn primary" onClick={refreshNow} disabled={d.status.running}>{d.status.running ? 'Refreshing…' : 'Refresh from qs.com'}</button>
      </PageHead>
      <div className="grid four stat-row">
        <div className="card"><div className="card-kicker">Read live</div><strong className="big-num">{live}/{d.sources.length}</strong></div>
        <div className="card"><div className="card-kicker">Last refresh</div><strong className="big-num small">{d.status.lastRun ? ago(d.status.lastRun.finished) : 'Not yet'}</strong></div>
        <div className="card"><div className="card-kicker">Schedule</div><strong className="big-num small">Every {d.status.refreshHours} h</strong></div>
        <div className="card"><div className="card-kicker">Saved copies dated</div><strong className="big-num small">{fmtDate(d.status.snapshotDate)}</strong></div>
      </div>
      {!d.status.live && <Note tone="warn">Live fetching is switched off (QS_LIVE_FETCH=0). All items are saved copies.</Note>}
      {d.status.live && live === 0 && !d.status.running && <Note tone="warn">No pages have been read live yet. If this persists, the server may not have internet access or qs.com may be refusing automated requests. Saved copies are shown meanwhile.</Note>}
      <div className="scroll"><table className="table">
        <thead><tr><th>Source</th><th>Domain</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>{d.sources.map(s => (
          <React.Fragment key={s.id}>
            <tr>
              <td><button className="plain-btn" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>{open === s.id ? '▾' : '▸'} {s.title}</button><div className="meta"><Ext href={s.url}>{s.url.replace('https://www.', '')}</Ext></div></td>
              <td>{domainName(s.domain)}</td>
              <td><SourceBadge status={s.status} asOf={s.asOf} /></td>
              <td className="meta">{s.lastError ? `Last attempt: ${s.lastError}` : s.status === 'live' ? `${s.excerpts.length} excerpts, ${s.headings.length} headings` : 'Saved summary'}</td>
            </tr>
            {open === s.id && <tr className="detail-row"><td colSpan={4}>
              <p><b>Description:</b> {s.summary}</p>
              {s.headings.length > 0 && <p><b>Headings:</b> {s.headings.join(' · ')}</p>}
              {s.excerpts.map((x, n) => <blockquote className="excerpt" key={n}>{x}</blockquote>)}
              {!s.excerpts.length && <p className="meta">No excerpts stored.</p>}
            </td></tr>}
          </React.Fragment>
        ))}</tbody>
      </table></div>
      <h2 className="sub-h">Latest links found on QS Insights</h2>
      {d.listing.length ? <ul className="listing">{d.listing.map(l => <li key={l.url}><Ext href={l.url}>{l.title} ↗</Ext> <Tag>{boot.domains.find(x => x.id === l.domain)?.short}</Tag></li>)}</ul> : <Empty>None yet. These appear after a successful live refresh.</Empty>}
      <Note>Rules the source service follows: public pages only; checks robots.txt; one request at a time; stores short excerpts, not whole pages; never reproduces licensed datasets. In production this would be replaced by approved QS data feeds with rights metadata.</Note>
    </>
  );
}

export function Admin() {
  const { toast, refresh } = useApp();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { api('admin/overview').then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <Empty>{err}</Empty>;
  if (!d) return <p className="muted">Loading…</p>;
  const arr = [...d.byTier, ...d.byPartnerTier].reduce((a, t) => a + t.arr, 0);
  async function reset() {
    try { await api('admin/reset', { method: 'POST' }); toast('Demo data reset.'); setConfirm(false); refresh(); api('admin/overview').then(setD); } catch (e) { toast(e.message, true); }
  }
  return (
    <>
      <PageHead eyebrow="QS team" title="Team console" intro="Network health for the membership team: tiers, participation and a full activity log." />
      <div className="grid four stat-row">
        <div className="card"><div className="card-kicker">Illustrative ARR in demo</div><strong className="big-num">£{(arr / 1e6).toFixed(2)}m</strong></div>
        <div className="card"><div className="card-kicker">Institutions</div><strong className="big-num">{d.counts.institutions}</strong></div>
        <div className="card"><div className="card-kicker">Member leaders</div><strong className="big-num">{d.counts.people}</strong></div>
        <div className="card"><div className="card-kicker">Partners</div><strong className="big-num">{d.counts.partners}</strong></div>
      </div>
      <div className="grid two">
        <div className="card"><h3 className="small">Pulse participation</h3><ul className="plain-list">{d.pulse.map(p => <li key={p.id}><span>{p.title}</span><b>{p.responses} ({p.real} real)</b></li>)}</ul></div>
        <div className="card"><h3 className="small">Circle membership</h3><ul className="plain-list">{d.circles.map(c => <li key={c.id}><span>{c.title}</span><b>{c.members}</b></li>)}</ul></div>
      </div>
      <h2 className="sub-h">Activity log</h2>
      {d.audit.length ? <div className="scroll"><table className="table"><thead><tr><th>When</th><th>Who</th><th>Action</th></tr></thead><tbody>{d.audit.map((a, n) => <tr key={n}><td className="meta">{ago(a.at)}</td><td>{a.name}</td><td>{a.action}{a.detail ? `: ${a.detail}` : ''}</td></tr>)}</tbody></table></div> : <Empty>No activity yet. Actions taken in the demo appear here.</Empty>}
      <div className="danger-zone">
        {confirm ? <><span>Reset all demo data to the starting state?</span><button className="btn small primary" onClick={reset}>Yes, reset</button><button className="btn small ghost" onClick={() => setConfirm(false)}>Cancel</button></> : <button className="btn small ghost" onClick={() => setConfirm(true)}>Reset demo data</button>}
      </div>
    </>
  );
}
