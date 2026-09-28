import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Tag, Lock, Link, Empty, Modal, Av, fmtDateTime, fmtDate, until, ago, Trust } from '../ui.jsx';

export function JoinButton({ c, onDone }) {
  const { toast, refresh } = useApp();
  async function toggle() { try { await api(`communities/${c.id}/join`, { method: c.isMember ? 'DELETE' : 'POST' }); toast(c.isMember ? `You left ${c.title}.` : `You joined ${c.title}. The facilitator will be in touch.`); await refresh(); onDone?.(); } catch (e) { toast(e.message, true); } }
  if (c.isMember) return <button className="btn sm ghost" onClick={toggle}>Leave</button>;
  if (c.canJoin) return <button className="btn sm amber" onClick={toggle}>Join community</button>;
  return <Lock>{c.whyNot}</Lock>;
}

function CommunityCard({ c }) {
  const { boot } = useApp();
  return (
    <article className="card">
      <div className="card-top">{c.flagship && <span className="new-badge">LAUNCH COMMUNITY</span>}<Tag tone="amber">{c.kind}</Tag>{c.domain && <Tag>{boot.domains.find(d => d.id === c.domain)?.short}</Tag>}{c.region && <Tag>{c.region}</Tag>}</div>
      <h3><Link to={`communities/${c.id}`} className="">{c.title}</Link></h3>
      <p>{c.charter}</p>
      <p className="meta">{c.memberCount} members from {c.institutionCount} institutions · Facilitator: {c.facilitator}</p>
      {c.next && <div className="notice left" style={{ padding: '8px 12px', fontSize: 14 }}>Next: {c.next.title} · {fmtDateTime(c.next.at)}</div>}
      <div className="card-foot"><Link to={`communities/${c.id}`}>Open</Link><JoinButton c={c} /></div>
    </article>
  );
}

export function Communities({ tab }) {
  const { boot, ent, toast, refresh } = useApp();
  const mine = boot.communities.filter(c => c.isMember);
  async function reg(s) { try { const r = await api(`open-sessions/${s.id}/register`, { method: 'POST' }); toast(r.registered ? 'Registered for the open session.' : 'Registration cancelled.'); refresh(); } catch (e) { toast(e.message, true); } }
  const domainC = boot.communities.filter(c => c.kind === 'Domain community');
  return (
    <>
      <PageTitle title="Communities" lede="Standing communities of practice, each with a QS facilitator, a charter and regular outputs such as use cases and joint projects. They pick up where summit roundtables leave off." />
      <div className="filters"><div className="seg" role="tablist">{[['mine', 'My communities'], ['all', 'All communities'], ['open', 'Open sessions']].map(([t, l]) => <a key={t} href={`#/communities${t === 'mine' ? '' : '/' + t}`} className={tab === t ? 'on' : ''}>{l}</a>)}</div></div>
      <div className="notice left">Your plan: <b>{ent.label}</b>. {ent.communities}. {ent.domainCommunities === 0 ? 'Free members join open quarterly sessions.' : ''}</div>
      <div style={{ height: 24 }} />
      {tab === 'mine' && (mine.length ? <div className="grid g3">{mine.map(c => <CommunityCard key={c.id} c={c} />)}</div> : <Empty>You have not joined a community yet. <Link to="communities/all">See all communities</Link>{ent.domainCommunities === 0 && <> or <Link to="communities/open">register for an open session</Link></>}.</Empty>)}
      {tab === 'all' && (
        <>
          <Panel title="Domain communities" sub="Member includes one; Member Plus and Council include all four." action={null}><div className="grid g2">{domainC.map(c => <CommunityCard key={c.id} c={c} />)}</div></Panel>
          <Panel title="Regional chapters & Executive Council" action={null}><div className="grid g3">{boot.communities.filter(c => c.kind !== 'Domain community').map(c => <CommunityCard key={c.id} c={c} />)}</div></Panel>
        </>
      )}
      {tab === 'open' && (
        <Panel title="Open quarterly sessions" sub="Open to every QS One institution, including the free Network. A way to meet a community before joining." action={null}>
          {boot.openSessions.map(s => (
            <div className="row" key={s.id}>
              <span className="person"><span className="session-date"><strong>{new Date(s.at).getDate()}</strong><span>{new Date(s.at).toLocaleString('en-GB', { month: 'short' })}</span></span>
                <span><strong>{s.title}</strong><span className="meta">{fmtDateTime(s.at)} · {until(s.at)} · {s.count} registered · hosted by {s.host}</span></span></span>
              <span className="person">{s.partnerId && <Trust label="Partner" />}{ent.kind === 'partner' ? <span className="meta">For institutions</span> : <button className={`btn sm ${s.registered ? 'ghost' : 'amber'}`} onClick={() => reg(s)}>{s.registered ? 'Cancel' : 'Register'}</button>}</span>
            </div>
          ))}
        </Panel>
      )}
    </>
  );
}

function NewPost({ c, onClose, onDone }) {
  const { toast } = useApp();
  const [f, setF] = useState({ type: 'Question', title: '', body: '' });
  async function submit(e) { e.preventDefault(); try { await api(`communities/${c.id}/posts`, { method: 'POST', body: f }); toast(f.type === 'Use case' ? 'Use case submitted. The facilitator reviews it before it joins the library.' : 'Posted to the community.'); onDone(); } catch (err) { toast(err.message, true); } }
  return (
    <Modal title={`Post to ${c.title}`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="seg" role="group">{['Question', 'Practice note', 'Use case'].map(t => <button type="button" key={t} className={f.type === t ? 'on' : ''} onClick={() => setF({ ...f, type: t })}>{t}</button>)}</div>
        <label className="field"><span>Title</span><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required minLength={8} /></label>
        <label className="field"><span>{f.type === 'Use case' ? 'What was the decision, what did you do, and what happened?' : 'Details'}</span><textarea className="textarea" rows={6} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} required minLength={20} /></label>
        <p className="meta">Visible to community members only. Chatham House rule. Share practice, not named student data or pricing.</p>
        <div className="form-actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn amber">Post</button></div>
      </form>
    </Modal>
  );
}

export function CommunityDetail({ id }) {
  const { boot, me, ent, toast } = useApp();
  const [c, setC] = useState(null);
  const [compose, setCompose] = useState(false);
  const [open, setOpen] = useState({});
  const [reply, setReply] = useState({});
  const load = () => api(`communities/${id}`).then(setC);
  useEffect(() => { load(); }, [id]);
  if (!c) return <p className="muted">Loading…</p>;
  async function send(p, e) { e.preventDefault(); try { await api(`posts/${p.id}/replies`, { method: 'POST', body: { body: reply[p.id] } }); setReply({ ...reply, [p.id]: '' }); load(); } catch (err) { toast(err.message, true); } }
  async function useful(p) { try { await api(`posts/${p.id}/useful`, { method: 'POST' }); load(); } catch (err) { toast(err.message, true); } }
  return (
    <>
      <Link to="communities/all" className="back">← Communities</Link>
      <PageTitle title={c.title} lede={c.charter} />
      <div className="two-col">
        <div>
          <Panel title="Discussion" sub="Questions, practice notes and use cases from members." action={c.posts ? <button className="btn amber" onClick={() => setCompose(true)}>Post</button> : null}>
            {!c.posts ? <div className="lock-panel"><strong>Join this community to read and post</strong><p>{c.canJoin ? 'Your plan includes this community.' : c.whyNot}</p>{c.canJoin ? <JoinButton c={c} onDone={load} /> : <Link to="membership/plans" className="btn amber">See plans</Link>}</div>
              : c.posts.length ? <div className="grid">{c.posts.map(p => (
                <article className="post" key={p.id}>
                  <div className="card-top"><Tag tone={p.type === 'Use case' ? 'amber' : p.type === 'Question' ? 'blue' : 'green'}>{p.type}</Tag>{p.status && <Tag tone="outline">{p.status}</Tag>}<span>{ago(p.createdAt)}</span></div>
                  <div className="person"><Av name={p.author.name} /><span><strong>{p.author.name}</strong><span className="meta">{p.author.title} · {p.author.orgName}</span></span></div>
                  <h3 style={{ margin: 0 }}>{p.title}</h3>
                  <p className="post-body">{p.body}</p>
                  <div className="card-top"><button className="btn sm ghost" onClick={() => useful(p)}>Useful · {p.useful.length}</button><button className="btn sm ghost" onClick={() => setOpen({ ...open, [p.id]: !open[p.id] })}>{p.replies.length} {p.replies.length === 1 ? 'reply' : 'replies'}</button></div>
                  {open[p.id] && <>{p.replies.map(r => <div className="reply" key={r.id}><Av name={r.author.name} /><div><strong>{r.author.name}</strong> <span className="meta">{r.author.orgName} · {ago(r.createdAt)}</span><p>{r.body}</p></div></div>)}
                    <form className="form" onSubmit={e => send(p, e)}><textarea className="textarea" rows={2} value={reply[p.id] || ''} onChange={e => setReply({ ...reply, [p.id]: e.target.value })} placeholder="Add a reply" required minLength={2} aria-label="Reply" /><div className="form-actions"><button className="btn sm">Reply</button></div></form></>}
                </article>
              ))}</div> : <Empty>No posts yet. Bring a live decision to the community.</Empty>}
          </Panel>
          {c.outputs?.length > 0 && <Panel title="Community outputs" sub="What this community has produced for members." action={null}>
            {c.outputs.map(o => <div className="row" key={o.title}><span><strong>{o.title}</strong><span className="meta">{o.type} · {fmtDate(o.date)}</span></span><Tag tone={o.status === 'Published' ? 'green' : 'amber'}>{o.status}</Tag></div>)}
          </Panel>}
        </div>
        <div className="grid">
          <Panel small title="About" action={null}>
            <div className="row"><span><strong>Facilitator</strong><span className="meta">{c.facilitator}</span></span></div>
            <div className="row"><span><strong>Cadence</strong><span className="meta">{c.cadence}</span></span></div>
            {c.commitments?.length > 0 && <div className="row"><span><strong>Member commitments</strong>{c.commitments.map(x => <span className="meta" key={x}>• {x}</span>)}</span></div>}
            <div className="row"><span><strong>Membership</strong><span className="meta">{c.memberCount} members · {c.institutionCount} institutions</span></span></div>
            <div style={{ paddingTop: 12 }}>{ent.kind !== 'partner' && <JoinButton c={c} onDone={load} />}</div>
          </Panel>
          <Panel small title="Sessions" action={null}>
            {c.sessions.length ? c.sessions.map(s => <div className="row" key={s.id}><span className="person"><span className="session-date"><strong>{new Date(s.at).getDate()}</strong><span>{new Date(s.at).toLocaleString('en-GB', { month: 'short' })}</span></span><span><strong>{s.title}</strong><span className="meta">{fmtDateTime(s.at)} · {s.format}</span></span></span></div>) : <Empty>Next session to be scheduled.</Empty>}
          </Panel>
          <Panel small title="Members" action={null}>
            {c.members.map(p => <div className="row" key={p.id}><span className="person"><Av name={p.name} me={p.id === me.id} /><span><strong>{p.name}{p.id === me.id ? ' (you)' : ''}</strong><span className="meta">{p.title} · {p.orgName}</span></span></span></div>)}
          </Panel>
        </div>
      </div>
      {compose && <NewPost c={c} onClose={() => setCompose(false)} onDone={() => { setCompose(false); load(); }} />}
    </>
  );
}
