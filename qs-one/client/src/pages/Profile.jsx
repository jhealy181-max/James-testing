import React, { useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Link, Tag, Note, Avatar, Empty, DomainTags } from '../ui.jsx';
import { IntroButton } from './Network.jsx';

const REGIONS = ['Africa', 'Americas', 'Asia Pacific', 'Europe', 'Middle East', 'South Asia'];
const PERSONAS = ['Executive', 'Strategy', 'Recruitment', 'Research', 'Partnerships', 'Careers', 'Digital'];

export default function Profile() {
  const { boot, me, ent, toast, refresh } = useApp();
  const [f, setF] = useState({ title: me.title, persona: me.persona, interests: me.interests, regions: me.regions, partnerContact: me.partnerContact, newsletter: boot.people.find(p => p.id === me.id)?.newsletter || 'weekly', bio: me.bio || '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const toggle = (k, v) => set(k, f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]);
  async function save(e) {
    e.preventDefault();
    try { await api('me', { method: 'PATCH', body: f }); toast('Profile saved. Your intelligence ranking has been updated.'); refresh(); } catch (err) { toast(err.message, true); }
  }
  const myCircles = boot.circles.filter(c => c.isMember);
  return (
    <>
      <PageHead eyebrow="Account" title="My profile" intro="Your role and interests decide what QS One shows you first. Your contact settings decide who can reach you." />
      <div className="split">
        <form className="card form" onSubmit={save}>
          <div className="person-top"><Avatar name={me.name} kind={me.orgType} size={52} /><div><strong>{me.name}</strong><span className="meta">{boot.org.name}</span></div></div>
          <label>Job title<input id="pf-title" value={f.title} onChange={e => set('title', e.target.value)} required minLength={2} /></label>
          {ent.kind === 'member' && <label>Role family<select id="pf-persona" value={f.persona} onChange={e => set('persona', e.target.value)}>{PERSONAS.map(p => <option key={p}>{p}</option>)}</select></label>}
          <fieldset><legend>Interests</legend><div className="checks">{boot.domains.map(d => <label key={d.id} className="check"><input type="checkbox" checked={f.interests.includes(d.id)} onChange={() => toggle('interests', d.id)} />{d.name}</label>)}</div></fieldset>
          <fieldset><legend>Regions you work on</legend><div className="checks">{REGIONS.map(r => <label key={r} className="check"><input type="checkbox" checked={f.regions.includes(r)} onChange={() => toggle('regions', r)} />{r}</label>)}</div></fieldset>
          <label>Short bio<textarea id="pf-bio" rows={3} value={f.bio} onChange={e => set('bio', e.target.value)} maxLength={600} /></label>
          <fieldset><legend>Contact and email</legend>
            <label className="check wide"><input type="checkbox" checked={f.partnerContact} onChange={e => set('partnerContact', e.target.checked)} />{ent.kind === 'partner' ? 'Accept introduction requests from members' : 'Partners may request introductions (you still accept or decline each one)'}</label>
            <label>Intelligence digest<select id="pf-news" value={f.newsletter} onChange={e => set('newsletter', e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly executive briefing only</option><option value="off">Off</option></select></label>
            <p className="meta">Preference only. The proof of concept does not send email.</p>
          </fieldset>
          <div className="form-actions"><button className="btn primary">Save profile</button></div>
        </form>
        <aside className="side-panel">
          <div className="card-kicker">Your access</div>
          <h3>{ent.label}</h3>
          <ul className="ent-list">
            <li className="yes">Intelligence and QS sources</li>
            <li className={ent.exchange ? 'yes' : 'no'}>Member Exchange</li>
            <li className={ent.pulse ? 'yes' : 'no'}>Pulse benchmarks{ent.cohortCuts ? ' with cohort cuts' : ent.pulse ? ' (headline results)' : ''}</li>
            <li className={ent.circles ? 'yes' : 'no'}>Domain Circles and Chapters</li>
            <li className={ent.peerCircles ? 'yes' : 'no'}>Private Peer Circles</li>
            <li className={ent.roundtables ? 'yes' : 'no'}>Closed roundtables</li>
            {ent.kind === 'member' && <li className="yes">{ent.introsPerQuarter >= 99 ? 'Unlimited' : ent.introsPerQuarter} introductions a quarter</li>}
            {ent.kind === 'member' && <li className="yes">{ent.summitPasses} summit passes a year</li>}
          </ul>
          <Link to="membership">Compare memberships →</Link>
          {ent.kind === 'member' && <><div className="card-kicker" style={{ marginTop: 20 }}>My Circles</div>{myCircles.length ? myCircles.map(c => <Link key={c.id} to={`circles/${c.id}`} className="row-link small"><span>{c.title}</span></Link>) : <p className="meta">None yet.</p>}
            <div className="card-kicker" style={{ marginTop: 20 }}>My institution</div><Link to={`institution/${me.orgId}`}>{boot.org.name} page →</Link></>}
        </aside>
      </div>
    </>
  );
}

export function Institution({ id }) {
  const { boot, me, ent, toast, refresh } = useApp();
  const i = boot.institutions.find(x => x.id === id);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(i ? { overview: i.overview, challenges: i.challenges, priorities: i.priorities, openTo: i.openTo.join(', '), visible: i.visible } : null);
  if (!i) return <Empty>This institution page is private or does not exist.</Empty>;
  const people = boot.people.filter(p => p.orgType === 'institution' && p.orgId === i.id);
  const canEdit = ent.kind === 'staff' || (me.orgId === i.id && me.role === 'admin');
  async function save(e) {
    e.preventDefault();
    try { await api(`institutions/${i.id}`, { method: 'PATCH', body: { ...f, openTo: f.openTo.split(',').map(s => s.trim()).filter(Boolean) } }); toast('Institution page saved.'); setEdit(false); refresh(); } catch (err) { toast(err.message, true); }
  }
  return (
    <>
      <Link to="network">← Network</Link>
      <PageHead eyebrow={`${i.country} · ${i.type}${i.verified ? ' · ✓ verified by QS' : ''}`} title={i.name} intro={i.overview}>
        {canEdit && !edit && <button className="btn ghost" onClick={() => setEdit(true)}>Edit page</button>}
      </PageHead>
      {edit ? (
        <form className="card form" onSubmit={save}>
          <label>Overview<textarea id="in-overview" rows={3} value={f.overview} onChange={e => setF({ ...f, overview: e.target.value })} /></label>
          <label>Current challenges (shown to peers)<textarea id="in-challenges" rows={3} value={f.challenges} onChange={e => setF({ ...f, challenges: e.target.value })} /></label>
          <fieldset><legend>Priorities</legend><div className="checks">{boot.domains.map(d => <label key={d.id} className="check"><input type="checkbox" checked={f.priorities.includes(d.id)} onChange={e => setF({ ...f, priorities: e.target.checked ? [...f.priorities, d.id] : f.priorities.filter(x => x !== d.id) })} />{d.name}</label>)}</div></fieldset>
          <label>Open to (comma separated)<input id="in-open" value={f.openTo} onChange={e => setF({ ...f, openTo: e.target.value })} /></label>
          <label className="check wide"><input type="checkbox" checked={f.visible} onChange={e => setF({ ...f, visible: e.target.checked })} />Show this institution in the member directory</label>
          <div className="form-actions"><button type="button" className="btn ghost" onClick={() => setEdit(false)}>Cancel</button><button className="btn primary">Save</button></div>
        </form>
      ) : (
        <div className="split">
          <div>
            <div className="card">
              <div className="card-kicker">Current challenges</div><p>{i.challenges || 'Not shared.'}</p>
              <div className="card-kicker">Priorities</div><div className="tags"><DomainTags ids={i.priorities} /></div>
              <div className="card-kicker">Open to</div><div className="tags">{i.openTo.map(o => <Tag key={o} tone="teal">{o}</Tag>)}</div>
            </div>
            <section className="section"><div className="section-head"><div><h2>People in QS One</h2></div></div>
              <div className="grid two">{people.map(p => (
                <div className="card person-card" key={p.id}><div className="person-top"><Avatar name={p.name} kind="institution" /><div><strong>{p.name}</strong><span className="meta">{p.title}</span></div></div><div className="card-foot"><span className="meta">{p.persona}</span><IntroButton person={p} /></div></div>
              ))}</div>
            </section>
          </div>
          <aside className="side-panel">
            <div className="card-kicker">Membership</div>
            <h3>{i.tier}</h3>
            <p className="meta">{boot.tiers[i.tier].summary}</p>
            <p className="meta">Directory visibility: {i.visible ? 'visible to members' : 'private'}</p>
            <p className="meta">QS One membership has no bearing on QS rankings.</p>
          </aside>
        </div>
      )}
    </>
  );
}
