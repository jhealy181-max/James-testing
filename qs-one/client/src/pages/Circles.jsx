import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Link, Tag, Note, Empty, Avatar, Modal, fmtDateTime, until, DomainTags } from '../ui.jsx';
import { PostCard, NewPost } from './Exchange.jsx';

const TYPES = ['Domain Circle', 'Regional Chapter', 'Peer Circle', 'Executive Council'];
const TYPE_TEXT = {
  'Domain Circle': 'Open working groups on one domain, run by a QS coordinator.',
  'Regional Chapter': 'Peers in one region. Meets at the matching QS summit and online.',
  'Peer Circle': 'Curated cohorts of 8–12 institutions on one shared challenge. Private.',
  'Executive Council': 'Heads of institution only.'
};

export function JoinButton({ c, onDone }) {
  const { toast, refresh } = useApp();
  const [ask, setAsk] = useState(false);
  const [note, setNote] = useState('');
  async function toggle() {
    try { await api(`circles/${c.id}/join`, { method: c.isMember ? 'DELETE' : 'POST' }); toast(c.isMember ? `You left ${c.title}.` : `You joined ${c.title}.`); await refresh(); onDone?.(); } catch (e) { toast(e.message, true); }
  }
  async function request(e) {
    e.preventDefault();
    try { await api(`circles/${c.id}/request`, { method: 'POST', body: { note } }); toast('Request sent to the coordinator. (Demo: no email is sent.)'); setAsk(false); } catch (err) { toast(err.message, true); }
  }
  if (c.isMember) return <button className="btn small ghost" onClick={toggle}>Leave</button>;
  if (c.canJoin) return <button className="btn small primary" onClick={toggle}>Join Circle</button>;
  if (c.invitationOnly && c.whyNot.startsWith('Invitation only. Ask')) return <>
    <button className="btn small ghost" onClick={() => setAsk(true)}>Request a place</button>
    {ask && <Modal title={`Request a place: ${c.title}`} onClose={() => setAsk(false)}><form className="form" onSubmit={request}><label>What would you bring and hope to get?<textarea id="circle-note" value={note} onChange={e => setNote(e.target.value)} rows={4} required minLength={10} /></label><div className="form-actions"><button className="btn primary">Send request</button></div></form></Modal>}
  </>;
  return <span className="locked" title={c.whyNot}>🔒 {c.whyNot}</span>;
}

export default function Circles() {
  const { boot, ent } = useApp();
  return (
    <>
      <PageHead eyebrow="Community" title="Circles" intro="Small, coordinated networks that meet regularly and carry conversations between QS summits. Each has a named coordinator, a cadence and a charter." />
      {ent.kind === 'partner' && <Note>Circles are for member institutions. Partners take part by hosting labelled roundtables in <Link to="convene">Convene</Link>.</Note>}
      {TYPES.map(t => {
        const list = boot.circles.filter(c => c.type === t);
        return (
          <section className="section" key={t}>
            <div className="section-head"><div><h2>{t}s</h2><p>{TYPE_TEXT[t]}</p></div></div>
            <div className="grid two">
              {list.map(c => {
                const next = (c.sessions || []).filter(s => Date.parse(s.at) > Date.now())[0];
                return (
                  <article className={`card circle-card ${c.isMember ? 'joined' : ''}`} key={c.id}>
                    <div className="card-kicker">{c.domain ? <DomainTags ids={[c.domain]} /> : <Tag>{c.region}</Tag>} {c.memberCount} members · {c.minTier}+</div>
                    <h3><Link to={`circles/${c.id}`} className="plain">{c.title}</Link></h3>
                    <p>{c.description}</p>
                    <div className="meta">{c.cadence} · Coordinator: {c.coordinator}</div>
                    {next && <div className="next-session">Next: {next.title} · {fmtDateTime(next.at)} ({until(next.at)})</div>}
                    <div className="card-foot"><Link to={`circles/${c.id}`}>Open →</Link>{ent.kind !== 'partner' && <JoinButton c={c} />}</div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function CircleDetail({ id }) {
  const { ent, me } = useApp();
  const [c, setC] = useState(null);
  const [posts, setPosts] = useState([]);
  const [compose, setCompose] = useState(false);
  const load = () => {
    api(`circles/${id}`).then(setC);
    api(`posts?circle=${id}`).then(d => setPosts(d.posts)).catch(() => setPosts([]));
  };
  useEffect(load, [id]);
  if (!c) return <p className="muted">Loading…</p>;
  const canSee = c.isMember || ent.kind === 'staff';
  return (
    <>
      <Link to="circles">← Circles</Link>
      <PageHead eyebrow={`${c.type}${c.region ? ` · ${c.region}` : ''}`} title={c.title} intro={c.description}>
        {ent.kind !== 'partner' && <JoinButton c={c} onDone={load} />}
      </PageHead>
      <div className="split">
        <div>
          <section className="section">
            <div className="section-head"><div><h2>Sessions</h2><p>{c.cadence}</p></div></div>
            {(c.sessions || []).length ? c.sessions.map(s => (
              <div className="session" key={s.id}>
                <div className="session-date"><strong>{new Date(s.at).getDate()}</strong><span>{new Date(s.at).toLocaleString('en-GB', { month: 'short' })}</span></div>
                <div><strong>{s.title}</strong><span className="meta">{fmtDateTime(s.at)} · {s.format} · {until(s.at)}</span></div>
              </div>
            )) : <Empty>Next session to be scheduled by the coordinator.</Empty>}
          </section>
          <section className="section">
            <div className="section-head"><div><h2>Discussion</h2><p>Private to Circle members. Chatham House rule applies.</p></div>{canSee && <button className="btn small primary" onClick={() => setCompose(true)}>Post to Circle</button>}</div>
            {canSee ? (posts.length ? <div className="stack">{posts.map(p => <PostCard key={p.id} post={p} onChange={load} />)}</div> : <Empty>No posts yet. Start with a question for the next session.</Empty>)
              : <div className="locked-panel"><strong>Join this Circle to read and post.</strong><p>{c.canJoin ? 'You can join with your current membership.' : c.whyNot}</p></div>}
          </section>
        </div>
        <aside className="side-panel">
          <div className="card-kicker">Coordinator</div>
          <p><strong>{c.coordinator}</strong></p>
          <div className="card-kicker">Members ({c.memberCount})</div>
          <div className="people-list">{c.members.map(p => (
            <Link key={p.id} to="network" className="person-row"><Avatar name={p.name} kind={p.orgType} size={30} /><span><strong>{p.name}{p.id === me.id ? ' (you)' : ''}</strong><em>{p.title} · {p.orgName}</em></span></Link>
          ))}</div>
          <p className="meta">Circle participation has no bearing on QS rankings.</p>
        </aside>
      </div>
      {compose && <NewPost circleId={c.id} onClose={() => setCompose(false)} onDone={() => { setCompose(false); load(); }} />}
    </>
  );
}
