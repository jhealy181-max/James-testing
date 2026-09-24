import React, { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Link, Tag, Avatar, Modal, Empty, Note, DomainTags, ago } from '../ui.jsx';

export function IntroButton({ person, context = 'Directory', label = 'Request introduction' }) {
  const { toast, refresh, me, ent, boot } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const pending = boot.intros.find(n => n.fromId === me.id && n.toId === person.id);
  if (person.id === me.id || person.orgType === 'qs') return null;
  if (pending) return <Tag tone={pending.status === 'accepted' ? 'teal' : 'gray'}>{pending.status === 'accepted' ? 'Connected' : pending.status === 'declined' ? 'Declined' : 'Request sent'}</Tag>;
  if (ent.kind === 'partner' && !person.partnerContact) return <span className="meta">Not open to partner contact</span>;
  async function send(e) {
    e.preventDefault();
    try { await api('intros', { method: 'POST', body: { toId: person.id, reason, context } }); toast(`Request sent to ${person.name}. They choose whether to connect.`); setOpen(false); refresh(); } catch (err) { toast(err.message, true); }
  }
  const quota = ent.kind === 'member' && ent.introsPerQuarter < 99 ? `${Math.max(0, ent.introsPerQuarter - boot.introsUsed)} of ${ent.introsPerQuarter} introductions left this quarter.` : null;
  return <>
    <button className="btn small ghost" onClick={() => setOpen(true)}>{label}</button>
    {open && (
      <Modal title={`Introduction to ${person.name}`} onClose={() => setOpen(false)}>
        <form className="form" onSubmit={send}>
          <p className="meta">{person.title} · {person.orgName}. Contact details are shared only if they accept.</p>
          {ent.kind === 'partner' && <Note>Partner request. It will be labelled as coming from {boot.org.name}.</Note>}
          <label>Why would this be useful to both of you?<textarea id="intro-reason" value={reason} onChange={e => setReason(e.target.value)} rows={4} required minLength={10} placeholder="For example: we are both rebalancing postgraduate source markets and I would value 20 minutes comparing approaches." /></label>
          {quota && <p className="meta">{quota}</p>}
          <div className="form-actions"><button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn primary">Send request</button></div>
        </form>
      </Modal>
    )}
  </>;
}

function Intros() {
  const { boot, me, toast, refresh } = useApp();
  const person = id => boot.people.find(p => p.id === id) || { name: 'Member', orgName: '' };
  const incoming = boot.intros.filter(n => n.toId === me.id);
  const outgoing = boot.intros.filter(n => n.fromId === me.id);
  async function respond(n, status) {
    try { await api(`intros/${n.id}`, { method: 'PATCH', body: { status } }); toast(status === 'accepted' ? 'Connected. Contact details are now shared with both of you.' : 'Declined. They will see the request was not taken up.'); refresh(); } catch (e) { toast(e.message, true); }
  }
  const Row = ({ n, other, actions }) => (
    <div className="intro-row">
      <Avatar name={other.name} kind={other.orgType} />
      <div className="intro-main"><strong>{other.name}</strong> <span className="meta">{other.title} · {other.orgName} · {ago(n.createdAt)} · via {n.context}</span><p>“{n.reason}”</p>
        {n.status === 'accepted' && <p className="contact">Contact shared: {other.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.invalid <span className="meta">(demo address)</span></p>}
      </div>
      <div className="intro-actions">{actions}</div>
    </div>
  );
  return (
    <>
      <section className="section"><div className="section-head"><div><h2>Requests to you</h2><p>You decide. Nothing is shared until you accept.</p></div></div>
        {incoming.length ? incoming.map(n => <Row key={n.id} n={n} other={person(n.fromId)} actions={n.status === 'requested' ? <><button className="btn small primary" onClick={() => respond(n, 'accepted')}>Accept</button><button className="btn small ghost" onClick={() => respond(n, 'declined')}>Decline</button></> : <Tag tone={n.status === 'accepted' ? 'teal' : 'gray'}>{n.status}</Tag>} />) : <Empty>No requests yet.</Empty>}
      </section>
      <section className="section"><div className="section-head"><div><h2>Your requests</h2></div></div>
        {outgoing.length ? outgoing.map(n => <Row key={n.id} n={n} other={person(n.toId)} actions={<Tag tone={n.status === 'accepted' ? 'teal' : 'gray'}>{n.status === 'requested' ? 'Waiting' : n.status}</Tag>} />) : <Empty>You have not requested any introductions.</Empty>}
      </section>
    </>
  );
}

export default function Network({ tab }) {
  const { boot, me, ent } = useApp();
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('all');
  const [region, setRegion] = useState('all');
  const [view, setView] = useState('people');
  const regions = [...new Set(boot.institutions.map(i => i.region))].sort();
  const people = useMemo(() => boot.people.filter(p => p.orgType === 'institution' && p.id !== me.id)
    .filter(p => domain === 'all' || p.interests.includes(domain))
    .filter(p => region === 'all' || p.region === region || p.regions.includes(region))
    .filter(p => !q || `${p.name} ${p.title} ${p.orgName} ${p.country}`.toLowerCase().includes(q.toLowerCase())), [boot, q, domain, region]);
  const insts = boot.institutions.filter(i => (domain === 'all' || i.priorities.includes(domain)) && (region === 'all' || i.region === region) && (!q || `${i.name} ${i.country} ${i.challenges}`.toLowerCase().includes(q.toLowerCase())));
  const pending = boot.intros.filter(n => n.toId === me.id && n.status === 'requested').length;

  return (
    <>
      <PageHead eyebrow="Community" title="Network" intro="Verified leaders and institutions that have chosen to be visible. Find someone facing the same decision and ask for a consent-based introduction." />
      <div className="seg big" role="tablist">
        <a href="#/network" className={tab !== 'intros' ? 'on' : ''}>Directory</a>
        <a href="#/network/intros" className={tab === 'intros' ? 'on' : ''}>Introductions {pending ? <span className="nav-badge">{pending}</span> : null}</a>
      </div>
      {tab === 'intros' ? <Intros /> : (
        <>
          {ent.kind === 'partner' && <Note>You see members who have opted in to partner contact. Every request is labelled as a partner request.</Note>}
          <div className="filters">
            <input type="search" id="net-search" placeholder="Search people, institutions, challenges" value={q} onChange={e => setQ(e.target.value)} aria-label="Search the network" />
            <select id="net-domain" value={domain} onChange={e => setDomain(e.target.value)} aria-label="Domain"><option value="all">All domains</option>{boot.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <select id="net-region" value={region} onChange={e => setRegion(e.target.value)} aria-label="Region"><option value="all">All regions</option>{regions.map(r => <option key={r}>{r}</option>)}</select>
            <div className="seg" role="group" aria-label="View">{[['people', 'People'], ['institutions', 'Institutions']].map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}</div>
          </div>
          {view === 'people' ? (
            <div className="grid three">
              {people.map(p => (
                <article className="card person-card" key={p.id}>
                  <div className="person-top"><Avatar name={p.name} kind="institution" size={44} /><div><strong>{p.name}</strong><span className="meta">{p.title}</span></div></div>
                  <Link to={`institution/${p.orgId}`} className="org-line">{p.orgName} · {p.country}</Link>
                  {p.bio && <p>{p.bio}</p>}
                  <div className="tags"><DomainTags ids={p.interests} /></div>
                  <div className="card-foot"><span className="meta">{p.persona}</span><IntroButton person={p} /></div>
                </article>
              ))}
              {!people.length && <Empty>No one matches these filters.</Empty>}
            </div>
          ) : (
            <div className="grid two">
              {insts.map(i => (
                <Link key={i.id} to={`institution/${i.id}`} className="card link-card">
                  <div className="card-kicker">{i.country} · {i.type}{i.verified ? ' · ✓ verified' : ''}</div>
                  <strong>{i.name}</strong>
                  <p>{i.challenges || i.overview}</p>
                  <div className="tags">{i.openTo.map(o => <Tag key={o} tone="teal">{o}</Tag>)}</div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
