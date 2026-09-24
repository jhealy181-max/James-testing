import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Link, Tag, Note, Empty, Modal, DomainTags, ago, Avatar } from '../ui.jsx';
import { PostCard } from './Exchange.jsx';
import { IntroButton } from './Network.jsx';

function Challenges() {
  const { boot, ent, toast } = useApp();
  const [list, setList] = useState(null);
  const [compose, setCompose] = useState(false);
  const [respond, setRespond] = useState(null);
  const [f, setF] = useState({ title: '', description: '', domain: 'mobility' });
  const [summary, setSummary] = useState('');
  const load = () => api('challenges').then(d => setList(d.challenges));
  useEffect(() => { load(); }, []);
  async function post(e) {
    e.preventDefault();
    try { await api('challenges', { method: 'POST', body: f }); toast('Challenge posted. Partners can now propose pilots.'); setCompose(false); setF({ title: '', description: '', domain: 'mobility' }); load(); } catch (err) { toast(err.message, true); }
  }
  async function propose(e) {
    e.preventDefault();
    try { await api(`challenges/${respond.id}/responses`, { method: 'POST', body: { summary } }); toast('Proposal sent. The institution decides whether to shortlist it.'); setRespond(null); setSummary(''); load(); } catch (err) { toast(err.message, true); }
  }
  async function mark(c, r, status) {
    try { await api(`challenges/${c.id}/responses/${r.id}`, { method: 'PATCH', body: { status } }); toast(`Proposal marked ${status.toLowerCase()}.`); load(); } catch (err) { toast(err.message, true); }
  }
  return (
    <>
      <div className="section-head"><div><h2>Challenge Board</h2><p>Institutions describe a real problem; partners propose a pilot. The institution controls who hears back.</p></div>{ent.kind === 'member' && <button className="btn primary" onClick={() => setCompose(true)}>Post a challenge +</button>}</div>
      {!list ? <p className="muted">Loading…</p> : <div className="stack">{list.map(c => (
        <article className="card challenge" key={c.id}>
          <div className="feed-top"><Tag tone={c.status === 'In pilot' ? 'teal' : 'pink'}>{c.status}</Tag><DomainTags ids={[c.domain]} /><span className="meta">{c.institution.name} · {ago(c.createdAt)}</span></div>
          <h3>{c.title}</h3>
          <p>{c.description}</p>
          <div className="responses">
            <div className="card-kicker">{c.responseCount} proposal{c.responseCount === 1 ? '' : 's'}{ent.kind === 'partner' ? ' (you see your own only)' : ''}</div>
            {c.responses.map(r => (
              <div className="proposal" key={r.id}>
                <div><strong>{r.partner.name}</strong> <span className="trust partner">Partner</span> <span className="meta">{ago(r.createdAt)}</span><p>{r.summary}</p></div>
                <div className="proposal-actions"><Tag tone={r.status === 'Selected' ? 'teal' : r.status === 'Declined' ? 'gray' : ''}>{r.status}</Tag>
                  {c.mine && r.status !== 'Selected' && <><button className="btn small ghost" onClick={() => mark(c, r, 'Shortlisted')}>Shortlist</button><button className="btn small primary" onClick={() => mark(c, r, 'Selected')}>Select for pilot</button></>}
                </div>
              </div>
            ))}
          </div>
          {ent.kind === 'partner' && c.status === 'Open for proposals' && !c.responses.length && <div className="card-foot"><span /><button className="btn small primary" onClick={() => setRespond(c)}>Propose a pilot</button></div>}
        </article>
      ))}</div>}
      {compose && <Modal title="Post a challenge" onClose={() => setCompose(false)}><form className="form" onSubmit={post}>
        <label>Challenge in one line<input id="ch-title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required minLength={8} /></label>
        <label>What would success look like, and what constraints apply?<textarea id="ch-desc" rows={5} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} required minLength={30} /></label>
        <label>Domain<select id="ch-domain" value={f.domain} onChange={e => setF({ ...f, domain: e.target.value })}>{boot.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <p className="meta">Visible to member institutions and QS One partners. Partners cannot contact you directly; you choose whom to shortlist.</p>
        <div className="form-actions"><button className="btn primary">Post challenge</button></div>
      </form></Modal>}
      {respond && <Modal title={`Propose a pilot: ${respond.title}`} onClose={() => setRespond(null)}><form className="form" onSubmit={propose}>
        <label>Your proposal (scope, timeline, cost to the institution)<textarea id="ch-proposal" rows={6} value={summary} onChange={e => setSummary(e.target.value)} required minLength={20} /></label>
        <div className="form-actions"><button className="btn primary">Send proposal</button></div>
      </form></Modal>}
    </>
  );
}

function Insights() {
  const { ent } = useApp();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('partner-insights').then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <div className="locked-panel"><strong>🔒 {err}</strong><p>Domain and Principal partners see aggregated, consented signals about what member leaders prioritise. Never individual data.</p><Link to="membership" className="btn ghost">See partner packages</Link></div>;
  if (!d) return <p className="muted">Loading…</p>;
  const max = Math.max(...d.interest.map(i => i.count));
  return (
    <>
      <div className="section-head"><div><h2>What member leaders prioritise</h2><p>Aggregated from {d.members} member profiles. Groups smaller than {d.minGroup} are hidden. {d.optedIn} members accept partner contact.</p></div></div>
      <div className="grid two">
        <div className="card"><h3 className="small">Interest by domain (people)</h3>
          <div className="bars">{d.interest.map(i => <div className="bar-row" key={i.domain}><span className="bar-label">{i.name}</span><span className="bar-track"><i style={{ width: `${(100 * i.count) / max}%` }} /></span><span className="bar-val">{i.count}</span></div>)}</div>
        </div>
        <div className="card"><h3 className="small">Open challenges by domain</h3>
          <div className="bars">{d.challengeByDomain.map(i => <div className="bar-row" key={i.domain}><span className="bar-label">{i.name}</span><span className="bar-track"><i className="alt" style={{ width: `${Math.min(100, i.open * 30)}%` }} /></span><span className="bar-val">{i.open}</span></div>)}</div>
        </div>
        <div className="card"><h3 className="small">Member roles</h3>
          <ul className="plain-list">{d.persona.map(p => <li key={p.persona}><span>{p.persona}</span><b>{p.count ?? `<${d.minGroup}`}</b></li>)}</ul>
        </div>
        <div className="card"><h3 className="small">Institutions by region</h3>
          <ul className="plain-list">{d.regions.map(p => <li key={p.region}><span>{p.region}</span><b>{p.count ?? '<2'}</b></li>)}</ul>
        </div>
      </div>
    </>
  );
}

export default function PartnerHub({ tab = 'overview' }) {
  const { boot, ent } = useApp();
  const [briefs, setBriefs] = useState([]);
  useEffect(() => { api('posts?type=Partner%20briefing').then(d => setBriefs(d.posts)).catch(() => {}); }, []);
  const tabs = [['overview', 'Partners'], ['challenges', 'Challenge Board'], ['insights', 'Leader priorities']];
  const partnerPeople = id => boot.people.filter(p => p.orgType === 'partner' && p.orgId === id);
  return (
    <>
      <PageHead eyebrow="Partner Hub" title={ent.kind === 'partner' ? `${boot.org.name} in QS One` : 'Partner Hub'} intro="Organisations that work with universities, in a space that members control. Partner content is always labelled; partners never see member data or contact details without consent." />
      <div className="seg big" role="tablist">{tabs.map(([t, l]) => <a key={t} href={`#/partners/${t}`} className={tab === t ? 'on' : ''}>{l}</a>)}</div>
      {tab === 'challenges' ? <Challenges /> : tab === 'insights' ? <Insights /> : (
        <>
          {ent.kind === 'partner' && (
            <div className="grid three partner-kpis">
              <div className="card"><div className="card-kicker">Package</div><strong className="big-num">{ent.tier}</strong><span className="meta">{boot.partnerTiers[ent.tier].summary}</span></div>
              <div className="card"><div className="card-kicker">Partner briefings this quarter</div><strong className="big-num">{briefs.filter(b => b.partnerId === boot.org.id).length} / {ent.postQuota}</strong><Link to="exchange">Publish a briefing →</Link></div>
              <div className="card"><div className="card-kicker">Roundtables you host</div><strong className="big-num">{boot.roundtables.filter(r => r.partnerId === boot.org.id).length}</strong><Link to="convene">See Convene →</Link></div>
            </div>
          )}
          <section className="section">
            <div className="section-head"><div><h2>QS One partners</h2><p>Sector-neutral. Any organisation that serves institutional leaders can partner, subject to the Independence Charter.</p></div></div>
            <div className="grid two">{boot.partners.map(p => (
              <article className="card partner-card" key={p.id}>
                <div className="feed-top"><span className="trust partner">Partner</span><Tag>{p.tier} Partner</Tag>{p.domainPartnerOf && <Tag tone="pink">{boot.domains.find(d => d.id === p.domainPartnerOf).short} domain partner</Tag>}</div>
                <h3>{p.name}</h3>
                <div className="meta">{p.sector}</div>
                <p>{p.description}</p>
                <div className="tags">{p.offers.map(o => <Tag key={o} tone="gray">{o}</Tag>)}</div>
                <div className="card-foot">
                  <span className="people-inline">{partnerPeople(p.id).map(x => <Avatar key={x.id} name={x.name} kind="partner" size={26} />)}</span>
                  {ent.kind === 'member' && partnerPeople(p.id)[0] && <IntroButton person={partnerPeople(p.id)[0]} label="Ask for a conversation" context="Partner Hub" />}
                </div>
              </article>
            ))}</div>
          </section>
          <section className="section">
            <div className="section-head"><div><h2>Partner briefings</h2><p>Labelled partner content. Members can mark it useful; QS does not endorse it.</p></div></div>
            <div className="stack">{briefs.map(b => <PostCard key={b.id} post={b} onChange={() => api('posts?type=Partner%20briefing').then(d => setBriefs(d.posts))} />)}</div>
          </section>
          <Note>What partners never get: member contact details without opt-in, personal-level data, influence over editorial or rankings, or content presented as QS’s own.</Note>
        </>
      )}
    </>
  );
}
