import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Tag, Lock, Link, Ext, Empty, Modal, Av, Trust, ago, until } from '../ui.jsx';

export function IntroButton({ person, context = 'Directory', label = 'Request introduction' }) {
  const { toast, refresh, me, ent, boot } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const pending = boot.intros.find(n => n.fromId === me.id && n.toId === person.id);
  if (person.id === me.id || person.orgId === me.orgId) return null;
  if (pending) return <Tag tone={pending.status === 'accepted' ? 'green' : ''}>{pending.status === 'accepted' ? 'Connected' : pending.status === 'declined' ? 'Declined' : pending.concierge ? 'With QS concierge' : 'Request sent'}</Tag>;
  if (ent.kind === 'member' && ent.introsPerQuarter === 0) return <Lock>Introductions from Member</Lock>;
  if (ent.kind === 'partner' && !person.partnerContact) return <span className="meta">Not open to partners</span>;
  async function send(e) { e.preventDefault(); try { await api('intros', { method: 'POST', body: { toId: person.id, reason, context } }); toast(ent.concierge ? `Your QS concierge will broker the introduction to ${person.name}.` : `Request sent. ${person.name} chooses whether to connect.`); setOpen(false); refresh(); } catch (err) { toast(err.message, true); } }
  const left = ent.introsPerQuarter >= 99 ? 'Concierge introductions are unlimited on Council.' : `${Math.max(0, ent.introsPerQuarter - boot.introsUsed)} of ${ent.introsPerQuarter} introductions left this quarter.`;
  return <>
    <button className="btn sm ghost" onClick={() => setOpen(true)}>{ent.concierge ? 'Concierge introduction' : label}</button>
    {open && <Modal title={`Introduction to ${person.name}`} onClose={() => setOpen(false)}><form className="form" onSubmit={send}>
      <p className="meta">{person.title} · {person.orgName}. Contact details are shared only if both sides accept.</p>
      {ent.kind === 'partner' && <div className="notice left">This request is labelled as coming from a commercial partner.</div>}
      <label className="field"><span>Why would this be useful to both of you?</span><textarea className="textarea" rows={4} value={reason} onChange={e => setReason(e.target.value)} required minLength={10} placeholder="For example: we are both rebalancing postgraduate source markets and I would value 20 minutes comparing approaches." /></label>
      <p className="meta">{ent.kind === 'partner' ? 'Partners can request 10 introductions a quarter.' : left}</p>
      <div className="form-actions"><button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn amber">Send request</button></div>
    </form></Modal>}
  </>;
}

export function Directory() {
  const { boot, me, ent } = useApp();
  const [q, setQ] = useState(''); const [domain, setDomain] = useState('all'); const [region, setRegion] = useState('all'); const [view, setView] = useState('people');
  const regions = [...new Set(boot.institutions.map(i => i.region))].sort();
  const people = useMemo(() => boot.people.filter(p => p.orgType === 'institution' && p.status === 'active' && p.orgId !== me.orgId).filter(p => domain === 'all' || p.interests.includes(domain)).filter(p => region === 'all' || p.region === region || p.regions.includes(region)).filter(p => !q || `${p.name} ${p.title} ${p.orgName} ${p.country}`.toLowerCase().includes(q.toLowerCase())), [boot, q, domain, region]);
  const insts = boot.institutions.filter(i => i.id !== me.orgId && (domain === 'all' || i.priorities.includes(domain)) && (region === 'all' || i.region === region) && (!q || `${i.name} ${i.country} ${i.challenges}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageTitle title="Connect" lede="Verified leaders and institutions. Search by shared challenge and ask for an introduction that both sides accept." />
      <Panel title="Directory" action={null}>
        <div className="notice left">Your plan: <b>{ent.label}</b>. {ent.connect}.</div>
        <div style={{ height: 20 }} />
        <div className="filters">
          <label className="field" style={{ flex: 1 }}><span>Search</span><input className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="People, institutions or challenges" /></label>
          <label className="field"><span>Domain</span><select className="select" value={domain} onChange={e => setDomain(e.target.value)}><option value="all">All domains</option>{boot.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label className="field"><span>Region</span><select className="select" value={region} onChange={e => setRegion(e.target.value)}><option value="all">All regions</option>{regions.map(r => <option key={r}>{r}</option>)}</select></label>
          <div className="seg" role="group">{[['people', 'People'], ['institutions', 'Institutions']].map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}</div>
        </div>
        {view === 'people' ? <div className="grid g3">{people.map(p => (
          <article className="card" key={p.id}>
            <div className="person"><Av name={p.name} /><span><strong>{p.name}</strong><span className="meta">{p.title}</span></span></div>
            <Link to={`institution/${p.orgId}`}>{p.orgName} · {p.country}</Link>
            <div className="card-top">{p.interests.map(d => <Tag key={d}>{boot.domains.find(x => x.id === d)?.short}</Tag>)}<Tag tone="outline">{p.tier === 'Free' ? 'Network' : p.tier}</Tag></div>
            <div className="card-foot"><span className="meta">{p.persona}</span><IntroButton person={p} /></div>
          </article>
        ))}{!people.length && <Empty>No one matches these filters.</Empty>}</div>
          : <div className="grid g2">{insts.map(i => (
            <Link key={i.id} to={`institution/${i.id}`} className="card link-card">
              <div className="card-top">{i.country} · {i.type}{i.verified && <Tag tone="green">✓ Verified</Tag>}<Tag tone="outline">{i.tier === 'Free' ? 'Network' : i.tier}</Tag></div>
              <h3>{i.name}</h3><p>{i.challenges || i.overview}</p>
              <div className="card-top">{i.openTo.map(o => <Tag key={o} tone="amber">{o}</Tag>)}</div>
            </Link>))}</div>}
      </Panel>
    </>
  );
}

export function Intros() {
  const { boot, me, toast, refresh } = useApp();
  const person = id => boot.people.find(p => p.id === id) || { name: 'Member', orgName: '' };
  const incoming = boot.intros.filter(n => n.toId === me.id), outgoing = boot.intros.filter(n => n.fromId === me.id);
  async function respond(n, status) { try { await api(`intros/${n.id}`, { method: 'PATCH', body: { status } }); toast(status === 'accepted' ? 'Connected. Contact details are now shared with both of you.' : 'Declined.'); refresh(); } catch (e) { toast(e.message, true); } }
  const Row = ({ n, other, actions }) => (
    <div className="row"><span className="person" style={{ alignItems: 'flex-start' }}><Av name={other.name} kind={other.orgType} /><span><strong>{other.name}</strong><span className="meta">{other.title} · {other.orgName} · {ago(n.createdAt)} · via {n.context}{n.partner ? ' · commercial partner' : ''}</span><span>“{n.reason}”</span>{n.status === 'accepted' && <span className="meta" style={{ color: 'var(--green)', fontWeight: 600 }}>Contact shared: {other.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.invalid (demo)</span>}</span></span><span className="card-top">{actions}</span></div>
  );
  return (
    <>
      <PageTitle title="Introductions" lede="Nothing is shared until both sides accept. Council introductions are brokered by a QS concierge." />
      <Panel small title="Requests to you" action={null}>{incoming.length ? incoming.map(n => <Row key={n.id} n={n} other={person(n.fromId)} actions={n.status === 'requested' ? <><button className="btn sm amber" onClick={() => respond(n, 'accepted')}>Accept</button><button className="btn sm ghost" onClick={() => respond(n, 'declined')}>Decline</button></> : <Tag tone={n.status === 'accepted' ? 'green' : ''}>{n.status}</Tag>} />) : <Empty>No requests yet.</Empty>}</Panel>
      <Panel small title="Your requests" action={null}>{outgoing.length ? outgoing.map(n => <Row key={n.id} n={n} other={person(n.toId)} actions={<Tag tone={n.status === 'accepted' ? 'green' : ''}>{n.status === 'requested' ? (n.concierge ? 'With QS concierge' : 'Waiting') : n.status}</Tag>} />) : <Empty>You have not requested any introductions.</Empty>}</Panel>
    </>
  );
}

function Matches({ eventId }) {
  const [m, setM] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { api(`events/${eventId}/matches`).then(setM).catch(e => setErr(e.message)); }, [eventId]);
  if (err) return <div className="lock-panel"><strong>🔒 {err}</strong><Link to="membership/plans" className="btn amber">See plans</Link></div>;
  if (!m) return <p className="muted">Finding people…</p>;
  if (!m.matches.length) return <Empty>No other members have marked this summit yet.</Empty>;
  return <div className="grid g3">{m.matches.map(({ person, reasons }) => (
    <article className="card" key={person.id}>
      <div className="person"><Av name={person.name} kind={person.orgType} /><span><strong>{person.name}</strong><span className="meta">{person.title} · {person.orgName}</span></span></div>
      <ul className="meta" style={{ margin: 0, paddingLeft: 18 }}>{reasons.map(r => <li key={r}>{r}</li>)}</ul>
      <div className="card-foot"><span />{person.orgType === 'partner' ? <Trust label="Partner" /> : <IntroButton person={person} context={m.event.title} label="Suggest a meeting" />}</div>
    </article>))}</div>;
}

export function Summits({ eventId }) {
  const { boot, ent, toast, refresh } = useApp();
  const events = [...boot.events].sort((a, b) => a.start.localeCompare(b.start));
  const e = events.find(x => x.id === eventId) || events.find(x => !x.past) || events[0];
  async function attend() { try { await api(`events/${e.id}/attend`, { method: 'POST' }); toast(e.attending ? 'Removed from your summit plan.' : 'Added to your summit plan.'); refresh(); } catch (err) { toast(err.message, true); } }
  return (
    <>
      <PageTitle title="QS summits" lede="QS One makes each summit count: matching before you arrive, community meet-ups on site, and follow-up in your communities afterwards." />
      <Panel title={e.title} sub={`${e.label} · ${e.place}`} action={<div className="card-top"><button className={`btn ${e.attending ? 'ghost' : 'amber'}`} onClick={attend} disabled={e.past}>{e.attending ? '✓ Attending' : 'I’m attending'}</button><Ext href={e.url} className="btn ghost">Official page ↗</Ext></div>}>
        <div className="filters"><div className="seg" role="tablist">{events.map(x => <a key={x.id} href={`#/connect/summits/${x.id}`} className={x.id === e.id ? 'on' : ''}>{x.short}</a>)}</div></div>
        {e.dateNote && <div className="notice left">{e.dateNote}</div>}
        <div style={{ height: 16 }} />
        <div className="tiles">
          <div className="tile"><span className="t-label">Starts</span><span className="t-val" style={{ fontSize: 30 }}>{until(e.start)}</span></div>
          <div className="tile"><span className="t-label">QS One members attending</span><span className="t-val">{e.attendeeCount}</span></div>
          <div className="tile"><span className="t-label">Your summit passes</span><span className="t-val">{ent.summitPasses || '–'}</span><span className="t-sub">{ent.tier === 'Member' ? 'For one summit' : ent.summitPasses ? 'Across the year' : 'Included from Member'}</span></div>
          <div className="tile"><span className="t-label">Matching</span><span className="t-val" style={{ fontSize: 30 }}>{ent.summitMatching === 'all' ? 'Every summit' : ent.summitMatching === 'one' ? 'One summit' : 'Member+'}</span>{ent.stand && <span className="t-sub">Includes a stand</span>}</div>
        </div>
      </Panel>
      <Panel title="Suggested meetings" sub="Other attendees matched on shared focus, regions, communities and what your institutions are open to." action={null}><Matches eventId={e.id} key={e.id + e.attendeeCount} /></Panel>
    </>
  );
}

export function Board() {
  const { boot, ent, toast } = useApp();
  const [items, setItems] = useState(null); const [compose, setCompose] = useState(false); const [respond, setRespond] = useState(null);
  const [f, setF] = useState({ title: '', description: '', domain: 'mobility' }); const [summary, setSummary] = useState('');
  const load = () => api('board').then(d => setItems(d.items));
  useEffect(() => { load(); }, []);
  async function post(e) { e.preventDefault(); try { await api('board', { method: 'POST', body: f }); toast('Posted. Commercial partners can now propose pilots.'); setCompose(false); load(); } catch (err) { toast(err.message, true); } }
  async function propose(e) { e.preventDefault(); try { await api(`board/${respond.id}/responses`, { method: 'POST', body: { summary } }); toast('Proposal sent. The institution decides whether to shortlist it.'); setRespond(null); setSummary(''); load(); } catch (err) { toast(err.message, true); } }
  async function mark(c, r, status) { try { await api(`board/${c.id}/responses/${r.id}`, { method: 'PATCH', body: { status } }); toast(`Proposal marked ${status.toLowerCase()}.`); load(); } catch (err) { toast(err.message, true); } }
  return (
    <>
      <PageTitle title="Partner board" lede="Institutions post a real problem; commercial partners propose a pilot. The institution decides who hears back." />
      <Panel title="Open problems" action={ent.kind === 'member' ? <button className="btn amber" onClick={() => setCompose(true)}>Post a problem</button> : null}>
        {!items ? <p className="muted">Loading…</p> : <div className="grid">{items.map(c => (
          <article className="post" key={c.id}>
            <div className="card-top"><Tag tone={c.status === 'In pilot' ? 'green' : 'amber'}>{c.status}</Tag><Tag>{boot.domains.find(d => d.id === c.domain)?.short}</Tag><span>{c.institution.name} · {ago(c.createdAt)}</span></div>
            <h3 style={{ margin: 0 }}>{c.title}</h3><p className="post-body">{c.description}</p>
            <div className="kicker">{c.responseCount} proposal{c.responseCount === 1 ? '' : 's'}{ent.kind === 'partner' ? ' · you see your own only' : ''}</div>
            {c.responses.map(r => <div className="row" key={r.id}><span><strong>{r.partner.name}</strong> <Trust label="Partner" /><span className="meta">{r.summary}</span></span><span className="card-top"><Tag tone={r.status === 'Selected' ? 'green' : ''}>{r.status}</Tag>{c.mine && r.status !== 'Selected' && <><button className="btn sm ghost" onClick={() => mark(c, r, 'Shortlisted')}>Shortlist</button><button className="btn sm amber" onClick={() => mark(c, r, 'Selected')}>Select</button></>}</span></div>)}
            {ent.kind === 'partner' && c.status === 'Open' && !c.responses.length && <div className="card-foot"><span /><button className="btn sm amber" onClick={() => setRespond(c)}>Propose a pilot</button></div>}
          </article>))}</div>}
      </Panel>
      {compose && <Modal title="Post a problem" onClose={() => setCompose(false)}><form className="form" onSubmit={post}>
        <label className="field"><span>Problem in one line</span><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required minLength={8} /></label>
        <label className="field"><span>What would success look like?</span><textarea className="textarea" rows={5} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} required minLength={30} /></label>
        <label className="field"><span>Domain</span><select className="select" value={f.domain} onChange={e => setF({ ...f, domain: e.target.value })}>{boot.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <div className="form-actions"><button className="btn amber">Post</button></div></form></Modal>}
      {respond && <Modal title={`Propose a pilot: ${respond.title}`} onClose={() => setRespond(null)}><form className="form" onSubmit={propose}>
        <label className="field"><span>Scope, timeline and cost to the institution</span><textarea className="textarea" rows={6} value={summary} onChange={e => setSummary(e.target.value)} required minLength={20} /></label>
        <div className="form-actions"><button className="btn amber">Send proposal</button></div></form></Modal>}
    </>
  );
}
