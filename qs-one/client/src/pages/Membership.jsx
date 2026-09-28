import React, { useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Tag, Link, Empty, Modal, Av, usd, ago } from '../ui.jsx';
import { IntroButton } from './Connect.jsx';

const PERSONAS = ['Executive', 'Strategy', 'Recruitment', 'Research', 'Partnerships', 'Careers', 'Digital', 'Finance'];

export function Onboarding({ compact }) {
  const { boot, me, toast, refresh } = useApp();
  const [invite, setInvite] = useState(false);
  const [f, setF] = useState({ name: '', title: '', persona: 'Recruitment' });
  const ob = boot.onboarding;
  const colleagues = boot.people.filter(p => p.orgId === me.orgId && p.orgType === 'institution');
  const links = { lead: 'membership', verify: 'membership', profile: `institution/${me.orgId}`, team: 'membership', pulse: 'pulse', community: boot.entitlements.domainCommunities ? 'communities/all' : 'communities/open' };
  async function send(e) { e.preventDefault(); try { await api('institution/invite', { method: 'POST', body: f }); toast(`Invitation sent to ${f.name}. (Demo: no email is sent.)`); setInvite(false); setF({ name: '', title: '', persona: 'Recruitment' }); refresh(); } catch (err) { toast(err.message, true); } }
  async function accept(p) { try { await api(`people/${p.id}/accept-invite`, { method: 'POST' }); toast(`${p.name} is now active.`); refresh(); } catch (err) { toast(err.message, true); } }
  return (
    <>
      <div className="progress" aria-label={`${ob.done} of ${ob.total} steps done`}><i style={{ width: `${(100 * ob.done) / ob.total}%` }} /></div>
      <div className="steps" style={{ marginTop: 10 }}>
        {ob.steps.map(s => (
          <div className={`step ${s.done ? 'done' : ''}`} key={s.id}>
            <span className="tick">{s.done ? '✓' : ''}</span>
            <span className="lbl"><b>{s.label}</b>{s.detail && <span className="meta"> · {s.detail}</span>}</span>
            {!s.done && (s.id === 'team' ? <button className="btn sm amber" onClick={() => setInvite(true)}>Invite colleague</button> : <Link to={links[s.id]}>Do this</Link>)}
          </div>
        ))}
      </div>
      {!compact && (
        <>
          <div style={{ height: 20 }} />
          <div className="panel-head"><div><h3>Colleagues on QS One</h3><p>Everyone at your institution shares one membership, with their own role and interests.</p></div><button className="btn sm amber" onClick={() => setInvite(true)}>Invite colleague</button></div>
          {colleagues.map(p => (
            <div className="row" key={p.id}>
              <span className="person"><Av name={p.name} me={p.id === me.id} /><span><strong>{p.name}{p.id === me.id ? ' (you)' : ''}</strong><span className="meta">{p.title} · {p.persona} · {p.status === 'invited' ? 'Invited' : `Last active ${ago(p.lastLogin)}`}</span></span></span>
              <span className="card-top">{p.role === 'lead' && <Tag tone="amber">QS One lead</Tag>}{p.status === 'invited' && <button className="btn sm ghost" onClick={() => accept(p)}>Demo: mark accepted</button>}</span>
            </div>
          ))}
        </>
      )}
      {invite && <Modal title="Invite a colleague" onClose={() => setInvite(false)}><form className="form" onSubmit={send}>
        <label className="field"><span>Name</span><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required minLength={3} /></label>
        <label className="field"><span>Job title</span><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required minLength={2} /></label>
        <label className="field"><span>Role family</span><select className="select" value={f.persona} onChange={e => setF({ ...f, persona: e.target.value })}>{PERSONAS.map(p => <option key={p}>{p}</option>)}</select></label>
        <p className="meta">They join your institution’s membership with a MyQS account. Do not enter real personal data in the demo.</p>
        <div className="form-actions"><button className="btn amber">Send invitation</button></div></form></Modal>}
    </>
  );
}

export function Membership() {
  const { boot, ent, me } = useApp();
  if (ent.kind !== 'member') return <><PageTitle title="Membership" lede="QS One membership is held by institutions. Compare the plans below." /><Plans embedded /></>;
  const org = boot.org;
  return (
    <>
      <PageTitle title="Our membership" lede={`${org.name} · ${ent.label}${org.foundingMember ? ' · Founding member' : ''}. One membership for everyone at your institution, with one set-up.`} />
      <Panel title="Set-up and activation" sub="Your institution counts as active when two or more colleagues log in at least every two months and you have answered at least one Pulse." action={<Tag tone={boot.onboarding.activation.active ? 'green' : 'amber'}>{boot.onboarding.activation.active ? 'Active institution' : 'Not yet active'}</Tag>}>
        <Onboarding />
      </Panel>
      <Panel title="What your plan includes" action={<Link to="membership/plans">Compare plans →</Link>}>
        <div className="tiles">
          <Link to="intelligence" className="tile"><span className="t-label">Intelligence</span><span className="t-sub">{ent.intel}</span></Link>
          <Link to="communities" className="tile"><span className="t-label">Communities</span><span className="t-sub">{ent.communities}</span></Link>
          <Link to="pulse" className="tile"><span className="t-label">Pulse</span><span className="t-sub">{ent.pulse}</span></Link>
          <Link to="connect" className="tile"><span className="t-label">Connect</span><span className="t-sub">{ent.connect}</span></Link>
        </div>
      </Panel>
      <div className="grid g2">
        <Panel small title="QS analytics included" action={null}>
          {ent.analytics.length ? ent.analytics.map(a => <div className="row" key={a}><span><strong>{a}</strong><span className="meta">Access through MyQS (illustrative)</span></span><Tag tone="green">Included</Tag></div>) : <Empty>Analytics products are included from Member Plus (Market Expert) and Council (WUR Rankings, Student Insight, Market Expert).</Empty>}
        </Panel>
        <Panel small title="Recognition" action={null}>
          {ent.recognition.length ? <div className="person" style={{ gap: 24, alignItems: 'center' }}><div className="badge-art"><span>QS One<small>{ent.label}</small><small>2026–27</small></span></div><div>{ent.recognition.map(r => <div className="row" key={r}><strong>{r}</strong></div>)}</div></div> : <Empty>Badge and certificate are included from Member.</Empty>}
        </Panel>
      </div>
    </>
  );
}

const ROWS = [
  ['Intelligence', 'intel'], ['Communities', 'communities'], ['Pulse', 'pulse'], ['Connect', 'connect'],
  ['Analytics', t => (t.analytics.length ? t.analytics.join('; ') : '–')], ['Recognition', t => (t.recognition.length ? t.recognition.join(', ') : 'None')]
];
export function Plans({ embedded }) {
  const { boot, ent, me, toast, refresh } = useApp();
  const [confirm, setConfirm] = useState(null);
  const names = Object.keys(boot.tiers);
  async function switchTier(t) { try { await api(`institutions/${me.orgId}`, { method: 'PATCH', body: { tier: t } }); toast(`Demo: ${boot.org.name} is now on ${t === 'Free' ? 'Network (free)' : t}. See how Communities, Pulse and Connect change.`); setConfirm(null); refresh(); } catch (e) { toast(e.message, true); } }
  const councilCount = boot.institutions.filter(i => i.tier === 'Council').length;
  return (
    <>
      {!embedded && <PageTitle title="Plans & benefits" lede="Priced for the whole institution, not per seat. One ladder from a free network to a capped Council. Prices are indicative." />}
      <Panel title="Membership tiers" action={null}>
        <div className="scroll"><table className="matrix">
          <thead><tr><th></th>{names.map(n => <th key={n} className={ent.tier === n ? 'cur' : ''}><div>{n === 'Free' ? 'Network' : n}{ent.tier === n && <> <Tag tone="blue">Your plan</Tag></>}</div><div className="price">{usd(boot.tiers[n].usd)}{boot.tiers[n].usd ? <small> / year</small> : null}</div>{n === 'Council' && <div className="meta">Capped at {boot.tiers[n].cap} · {councilCount} taken</div>}</th>)}</tr></thead>
          <tbody>
            {ROWS.map(([label, key]) => <tr key={label}><td>{label}</td>{names.map(n => <td key={n} className={ent.tier === n ? 'cur' : ''}>{typeof key === 'function' ? key(boot.tiers[n]) : boot.tiers[n][key]}</td>)}</tr>)}
            {ent.kind === 'member' && <tr><td>Demo</td>{names.map(n => <td key={n} className={ent.tier === n ? 'cur' : ''}>{ent.tier !== n && <button className="btn sm ghost" onClick={() => setConfirm(n)}>Switch to {n === 'Free' ? 'Network' : n}</button>}</td>)}</tr>}
          </tbody>
        </table></div>
      </Panel>
      <div className="notice left grey">Indicative prices in US dollars (Member $20k, Member Plus $60k, Council $110k). Existing QS One members move across on their current terms. No payments are taken in this demo.</div>
      {confirm && <Modal title={`Switch to ${confirm === 'Free' ? 'Network (free)' : confirm}?`} onClose={() => setConfirm(null)}><p>This demo switch shows how access changes. No contract or payment is involved.</p><div className="form-actions"><button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button><button className="btn amber" onClick={() => switchTier(confirm)}>Switch</button></div></Modal>}
    </>
  );
}

export function Institution({ id }) {
  const { boot, me, ent, toast, refresh } = useApp();
  const i = boot.institutions.find(x => x.id === id);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(i ? { overview: i.overview, challenges: i.challenges, priorities: i.priorities, openTo: i.openTo.join(', '), visible: i.visible } : null);
  if (!i) return <Empty>This institution profile is private or does not exist.</Empty>;
  const people = boot.people.filter(p => p.orgType === 'institution' && p.orgId === i.id && p.status === 'active');
  const canEdit = ent.kind === 'staff' || (me.orgId === i.id && me.role === 'lead');
  async function save(e) { e.preventDefault(); try { await api(`institutions/${i.id}`, { method: 'PATCH', body: { ...f, openTo: f.openTo.split(',').map(s => s.trim()).filter(Boolean) } }); toast('Institution profile saved.'); setEdit(false); refresh(); } catch (err) { toast(err.message, true); } }
  return (
    <>
      <PageTitle title={i.name} lede={`${i.country} · ${i.type} · ${i.tier === 'Free' ? 'Network' : i.tier}${i.verified ? ' · Verified by QS' : ''}`} />
      <Panel title="Profile" action={canEdit && !edit ? <button className="btn ghost" onClick={() => setEdit(true)}>Edit profile</button> : null}>
        {edit ? <form className="form" onSubmit={save}>
          <label className="field"><span>Overview</span><textarea className="textarea" value={f.overview} onChange={e => setF({ ...f, overview: e.target.value })} /></label>
          <label className="field"><span>Current challenges (shown to peers)</span><textarea className="textarea" value={f.challenges} onChange={e => setF({ ...f, challenges: e.target.value })} /></label>
          <fieldset><legend>Priorities</legend><div className="checks">{boot.domains.map(d => <label key={d.id} className="check"><input type="checkbox" checked={f.priorities.includes(d.id)} onChange={e => setF({ ...f, priorities: e.target.checked ? [...f.priorities, d.id] : f.priorities.filter(x => x !== d.id) })} />{d.name}</label>)}</div></fieldset>
          <label className="field"><span>Open to (comma separated)</span><input className="input" value={f.openTo} onChange={e => setF({ ...f, openTo: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={f.visible} onChange={e => setF({ ...f, visible: e.target.checked })} />Show in the QS One directory</label>
          <div className="form-actions"><button type="button" className="btn ghost" onClick={() => setEdit(false)}>Cancel</button><button className="btn amber">Save</button></div>
        </form> : <div className="grid g2">
          <div><div className="kicker">Overview</div><p>{i.overview || 'Not added yet.'}</p><div className="kicker">Current challenges</div><p>{i.challenges || 'Not shared.'}</p></div>
          <div><div className="kicker">Priorities</div><div className="card-top" style={{ margin: '6px 0 14px' }}>{i.priorities.map(d => <Tag key={d}>{boot.domains.find(x => x.id === d)?.name}</Tag>)}</div><div className="kicker">Open to</div><div className="card-top" style={{ marginTop: 6 }}>{i.openTo.map(o => <Tag key={o} tone="amber">{o}</Tag>)}</div></div>
        </div>}
      </Panel>
      <Panel title="People on QS One" action={null}>
        <div className="grid g3">{people.map(p => <article className="card" key={p.id}><div className="person"><Av name={p.name} me={p.id === me.id} /><span><strong>{p.name}</strong><span className="meta">{p.title}</span></span></div><div className="card-foot"><span className="meta">{p.persona}</span><IntroButton person={p} /></div></article>)}</div>
      </Panel>
    </>
  );
}

export function Profile() {
  const { boot, me, ent, toast, refresh } = useApp();
  const REGIONS = ['Africa', 'Americas', 'Asia Pacific', 'Europe', 'Middle East', 'South Asia'];
  const [f, setF] = useState({ title: me.title, persona: me.persona, interests: me.interests, regions: me.regions, partnerContact: me.partnerContact, newsletter: me.newsletter || 'weekly', bio: me.bio || '' });
  const toggle = (k, v) => setF(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));
  async function save(e) { e.preventDefault(); try { await api('me', { method: 'PATCH', body: f }); toast('Profile saved. Intelligence and Pulse suggestions updated.'); refresh(); } catch (err) { toast(err.message, true); } }
  return (
    <>
      <PageTitle title="My profile" lede="Your role and interests decide what QS One shows you first. Your contact settings decide who can reach you." />
      <Panel title={me.name} sub={`${me.orgName}`} action={null}>
        <form className="form" onSubmit={save}>
          <div className="grid g2">
            <label className="field"><span>Job title</span><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required minLength={2} /></label>
            {ent.kind === 'member' && <label className="field"><span>Role family (targets Pulse and briefings)</span><select className="select" value={f.persona} onChange={e => setF({ ...f, persona: e.target.value })}>{PERSONAS.map(p => <option key={p}>{p}</option>)}</select></label>}
          </div>
          <fieldset><legend>Interests</legend><div className="checks">{boot.domains.map(d => <label key={d.id} className="check"><input type="checkbox" checked={f.interests.includes(d.id)} onChange={() => toggle('interests', d.id)} />{d.name}</label>)}</div></fieldset>
          <fieldset><legend>Regions you work on</legend><div className="checks">{REGIONS.map(r => <label key={r} className="check"><input type="checkbox" checked={f.regions.includes(r)} onChange={() => toggle('regions', r)} />{r}</label>)}</div></fieldset>
          <label className="field"><span>Short bio</span><textarea className="textarea" value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} maxLength={600} /></label>
          <fieldset><legend>Contact and email</legend>
            <label className="check"><input type="checkbox" checked={f.partnerContact} onChange={e => setF({ ...f, partnerContact: e.target.checked })} />Commercial partners may request introductions (you accept or decline each one)</label>
            <label className="field"><span>Weekly Signal newsletter</span><select className="select" value={f.newsletter} onChange={e => setF({ ...f, newsletter: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly briefings only</option><option value="off">Off</option></select></label>
          </fieldset>
          <div className="form-actions"><span className="meta">Preferences only. The demo does not send email.</span><button className="btn amber">Save profile</button></div>
        </form>
      </Panel>
    </>
  );
}
