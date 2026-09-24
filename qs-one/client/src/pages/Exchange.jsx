import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Trust, DomainTags, Avatar, ago, Empty, Modal, Note, Link } from '../ui.jsx';

const LABEL = { 'Practice note': 'Member Practice', Question: 'Question', 'Partner briefing': 'Partner' };

export function PostCard({ post, onChange }) {
  const { me, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const voted = post.upvotes.includes(me.id);
  async function send(e) {
    e.preventDefault(); setBusy(true);
    try { await api(`posts/${post.id}/replies`, { method: 'POST', body: { body: reply } }); setReply(''); toast('Reply posted.'); onChange(); } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  async function vote() { try { await api(`posts/${post.id}/upvote`, { method: 'POST' }); onChange(); } catch (err) { toast(err.message, true); } }
  return (
    <article className={`card post ${post.type === 'Partner briefing' ? 'partner-post' : ''}`}>
      <div className="post-head">
        <Avatar name={post.author.name} kind={post.author.orgType} />
        <div><strong>{post.author.name}</strong><span className="meta">{post.author.title} · {post.author.orgName} · {ago(post.createdAt)}</span></div>
        <Trust label={LABEL[post.type]} />
      </div>
      <h3>{post.title}</h3>
      <p className="post-body">{post.body}</p>
      <div className="tags"><DomainTags ids={post.domains} />{post.circleTitle && <span className="tag teal">Circle: {post.circleTitle}</span>}</div>
      <div className="post-actions">
        <button className={`chip ${voted ? 'on' : ''}`} onClick={vote} aria-pressed={voted}>▲ Useful · {post.upvotes.length}</button>
        <button className="chip" onClick={() => setOpen(o => !o)} aria-expanded={open}>{post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</button>
      </div>
      {open && (
        <div className="replies">
          {post.replies.map(r => (
            <div className="reply" key={r.id}>
              <Avatar name={r.author.name} kind={r.author.orgType} size={28} />
              <div><strong>{r.author.name}</strong> <span className="meta">{r.author.orgName} · {ago(r.createdAt)}</span><p>{r.body}</p></div>
            </div>
          ))}
          <form onSubmit={send} className="reply-form">
            <label className="sr-only" htmlFor={`reply-${post.id}`}>Your reply</label>
            <textarea id={`reply-${post.id}`} value={reply} onChange={e => setReply(e.target.value)} placeholder="Add a reply. Share practice, not confidential data." rows={2} required minLength={2} />
            <button className="btn small primary" disabled={busy}>Reply</button>
          </form>
        </div>
      )}
    </article>
  );
}

export function NewPost({ onClose, onDone, circleId, defaultType }) {
  const { boot, ent, toast, me } = useApp();
  const types = ent.kind === 'partner' ? ['Partner briefing'] : ['Practice note', 'Question'];
  const [f, setF] = useState({ type: defaultType || types[0], title: '', body: '', domains: me.interests.slice(0, 1) });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    try { await api('posts', { method: 'POST', body: { ...f, circleId } }); toast(f.type === 'Question' ? 'Question posted to the network.' : 'Posted.'); onDone(); } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  return (
    <Modal title={circleId ? 'Post to this Circle' : 'Share with the network'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {types.length > 1 && <div className="seg" role="group" aria-label="Post type">{types.map(t => <button type="button" key={t} className={f.type === t ? 'on' : ''} onClick={() => set('type', t)}>{t}</button>)}</div>}
        {ent.kind === 'partner' && <Note>Partner briefings are labelled “Partner” wherever they appear. Your {ent.tier} package includes {ent.postQuota} per quarter.</Note>}
        <label>Title<input id="post-title" value={f.title} onChange={e => set('title', e.target.value)} required minLength={8} maxLength={160} placeholder={f.type === 'Question' ? 'What do you want to ask peers?' : 'What did you do, and what happened?'} /></label>
        <label>{f.type === 'Question' ? 'Details' : 'Body'}<textarea id="post-body" value={f.body} onChange={e => set('body', e.target.value)} required minLength={20} rows={6} /></label>
        <fieldset><legend>Domains</legend><div className="checks">{boot.domains.map(d => (
          <label key={d.id} className="check"><input type="checkbox" checked={f.domains.includes(d.id)} onChange={e => set('domains', e.target.checked ? [...f.domains, d.id] : f.domains.filter(x => x !== d.id))} />{d.name}</label>
        ))}</div></fieldset>
        <p className="meta">Only verified members see the Exchange. Do not share named student data or pricing.</p>
        <div className="form-actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>Post</button></div>
      </form>
    </Modal>
  );
}

export default function Exchange() {
  const { ent } = useApp();
  const [posts, setPosts] = useState(null);
  const [type, setType] = useState('');
  const [compose, setCompose] = useState(false);
  const load = () => api(`posts${type ? `?type=${encodeURIComponent(type)}` : ''}`).then(d => setPosts(d.posts));
  useEffect(() => { load(); }, [type]);
  return (
    <>
      <PageHead eyebrow="Community" title="Member Exchange" intro="Practice notes and questions from verified leaders. What members write here is theirs, labelled as member content, and never presented as QS analysis.">
        <button className="btn primary" onClick={() => setCompose(true)}>{ent.kind === 'partner' ? 'Publish partner briefing' : 'Share or ask +'}</button>
      </PageHead>
      {ent.kind === 'partner' && <Note>As a partner you see partner briefings only. Member discussion is private to member institutions.</Note>}
      {ent.kind !== 'partner' && (
        <div className="seg" role="group" aria-label="Filter">
          {[['', 'All'], ['Practice note', 'Practice notes'], ['Question', 'Questions'], ['Partner briefing', 'Partner briefings']].map(([v, l]) => <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>)}
        </div>
      )}
      <div className="stack">{!posts ? <p className="muted">Loading…</p> : posts.length ? posts.map(p => <PostCard key={p.id} post={p} onChange={load} />) : <Empty>Nothing here yet. <Link to="exchange">Start the conversation.</Link></Empty>}</div>
      {compose && <NewPost onClose={() => setCompose(false)} onDone={() => { setCompose(false); load(); }} />}
    </>
  );
}
