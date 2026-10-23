import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Tag, Link, Empty, HBars, ago } from '../ui.jsx';

const OPPS = [
  ['Intelligence', 'Sponsor a labelled webinar series; co-develop research with QS keeping editorial control'],
  ['Communities', 'Host an open session on a problem the partner solves'],
  ['Pulse', 'Aggregated insight on what leaders prioritise (groups of five or more)'],
  ['Connect', 'Meetings with members who opt in; respond to problems on the partner board']
];

export function Partners() {
  const { ent } = useApp();
  const [d, setD] = useState(null);
  useEffect(() => { if (ent.kind !== 'member') api('partner-insights').then(setD).catch(() => {}); }, []);
  return (
    <>
      <PageTitle title="Partner opportunities" lede="Every component has an opening for commercial partners, but network growth comes first. Partner revenue sits outside the institutional target." />
      <Panel title="Where partners fit" action={null}>
        <div className="tiles">{OPPS.map(([k, v]) => <div className="tile" key={k}><span className="t-label"><b>{k}</b></span><span className="t-sub">{v}</span></div>)}</div>
      </Panel>
      <Panel title="Rules that protect members" action={null}>
        <div className="grid g2">
          {['Partner content is always labelled and never presented as QS analysis.', 'No contact without the member’s opt-in; members accept or decline each introduction.', 'Partners never see Pulse results, community discussions or personal data.', 'Partnership has no bearing on QS rankings or editorial decisions.'].map(x => <div className="inner" key={x}>{x}</div>)}
        </div>
      </Panel>
      {d && (
        <Panel title="What leaders prioritise" sub={`Aggregated from ${d.members} member profiles. ${d.optedIn} accept partner contact. Groups under ${d.minGroup} are hidden.`} action={null}>
          <div className="grid g2">
            <div className="inner"><h3 style={{ marginTop: 0 }}>Interest by domain</h3><HBars options={d.interest.map(i => ({ option: i.name, pct: Math.round((100 * i.count) / d.members) }))} /></div>
            <div className="inner"><h3 style={{ marginTop: 0 }}>Biggest recruitment risk (Pulse, n = {d.n})</h3>{d.risks ? <HBars options={d.risks.map(r => ({ option: r.option, pct: Math.round((100 * r.count) / d.n) }))} /> : <Empty>Not enough responses to show.</Empty>}</div>
          </div>
        </Panel>
      )}
      {ent.kind === 'partner' && <div className="grid g2"><Link to="connect/board" className="card link-card"><h3>Partner board</h3><p>See institutions’ problems and propose a pilot.</p></Link><Link to="communities/open" className="card link-card"><h3>Open sessions</h3><p>Sessions you host appear to every institution, labelled as partner-hosted.</p></Link></div>}
    </>
  );
}

export function Help() {
  const { boot } = useApp();
  return (
    <>
      <PageTitle title="About this demo" lede="QS One is shown here as a proof of concept. Use the selector in the top bar to switch between people and see how each plan changes what they can do." />
      <Panel title="People to try" action={null}>
        {boot.personas.map(p => <div className="row" key={p.id}><span><strong>{p.name}</strong><span className="meta">{p.title} · {p.orgName}</span></span><Tag tone="amber">{p.label}</Tag></div>)}
      </Panel>
      <Panel title="A ten-minute walkthrough" action={null}>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li><b>Jordan Price (Member Plus):</b> Overview, then Pulse. Answer the October Recruitment Pulse and see your deposits against the peer median, with the four status cards.</li>
          <li>Change the cohort to a region. Try a small region to see results hidden below five institutions.</li>
          <li>Communities: open the Student Recruitment & International Office community, read the discussion and post a use case.</li>
          <li><b>Wei Lin Tan (Member):</b> try to join a second domain community. Member includes one.</li>
          <li><b>Dr Amara Okafor (Network, free):</b> read any QS newsletter or magazine article free, see that the curated For you feed needs Member, register for an open session, answer a Pulse, and see why introductions need Member. Then Membership: invite a colleague to become an active institution.</li>
          <li><b>Maya Chen (QS team):</b> Intelligence: pin a story, hide one, add a video to the media library. Team view: post a banner message and check content sources.</li>
          <li><b>Dr Fatima Al Mansoori (Council):</b> build a bespoke Pulse cohort and use concierge introductions.</li>
          <li><b>Sam Rivera (commercial partner):</b> respond on the partner board; Pulse results stay locked.</li>
          <li>Plans & benefits: switch the demo tier and watch access change.</li>
        </ol>
      </Panel>
      <div className="notice left grey">All institutions, people and partners are fictional. There is no sign-in and no email is sent. QS content links to qs.com and shows whether it was read live or from a saved copy.</div>
    </>
  );
}

// Light-touch content admin: ingestion runs on its own; the team only pins, hides and posts messages.
function ContentAdmin() {
  const { boot, toast, refresh } = useApp();
  const [f, setF] = useState({ text: '', link: '', linkLabel: '', days: 7 });
  const [pinned, setPinned] = useState([]);
  useEffect(() => { api('content?view=latest&limit=200&hidden=1').then(d => setPinned(d.items.filter(i => i.pinned || i.hidden))); }, []);
  async function post(e) { e.preventDefault(); try { await api('messages', { method: 'POST', body: f }); toast('Message posted. Everyone sees it at the top of QS One.'); setF({ text: '', link: '', linkLabel: '', days: 7 }); refresh(); } catch (err) { toast(err.message, true); } }
  async function remove(id) { try { await api(`messages/${id}`, { method: 'DELETE' }); toast('Message removed.'); refresh(); } catch (err) { toast(err.message, true); } }
  const st = boot.content.ingest;
  return (
    <div className="grid g2">
      <Panel small title="Banner messages" action={null}>
        <form className="form" onSubmit={post}>
          <label className="field"><span>Message</span><input className="input" required minLength={3} maxLength={280} value={f.text} onChange={e => setF({ ...f, text: e.target.value })} placeholder="e.g. QS Insights Magazine 47 is out" /></label>
          <div className="filters" style={{ marginBottom: 0 }}>
            <label className="field"><span>Link (optional)</span><input className="input" value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="#/intelligence/magazine or https://…" /></label>
            <label className="field" style={{ minWidth: 120 }}><span>Button text</span><input className="input" value={f.linkLabel} onChange={e => setF({ ...f, linkLabel: e.target.value })} placeholder="Read it" /></label>
            <label className="field" style={{ minWidth: 100 }}><span>Show for</span><select className="select" value={f.days} onChange={e => setF({ ...f, days: Number(e.target.value) })}>{[1, 3, 7, 14, 30].map(n => <option key={n} value={n}>{n} day{n > 1 ? 's' : ''}</option>)}</select></label>
          </div>
          <div className="form-actions"><button className="btn amber">Post message</button></div>
        </form>
        {boot.messages.map(m => <div className="row" key={m.id}><span><strong>{m.text}</strong><span className="meta">{m.by} · {m.until ? `until ${new Date(m.until).toLocaleDateString('en-GB')}` : 'no end date'}</span></span><button className="btn sm ghost" onClick={() => remove(m.id)}>Remove</button></div>)}
      </Panel>
      <Panel small title="Content" action={<Link to="intelligence/sources">Sources →</Link>}>
        <div className="row"><span><strong>{boot.content.items} stories</strong><span className="meta">{boot.content.editions} magazine editions · last checked {st.lastRun ? ago(st.lastRun.finished) : 'not yet'} · every {st.everyHours} h</span></span></div>
        <p className="meta">New content is read, split and tagged automatically. Pin or hide a story from its card or article page.</p>
        {pinned.length ? pinned.map(i => <div className="row" key={i.id}><span><Link to={`intelligence/a/${encodeURIComponent(i.id)}`}>{i.title}</Link><span className="meta">{i.series}</span></span><Tag tone={i.hidden ? 'red' : 'navy'}>{i.hidden ? 'Hidden' : 'Pinned'}</Tag></div>) : <p className="meta">Nothing pinned or hidden.</p>}
      </Panel>
    </div>
  );
}

export function Admin() {
  const { toast, refresh } = useApp();
  const [d, setD] = useState(null); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState(false);
  const load = () => api('admin/overview').then(setD).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  if (err) return <Empty>{err}</Empty>;
  if (!d) return <p className="muted">Loading…</p>;
  async function reset() { try { await api('admin/reset', { method: 'POST' }); toast('Demo data reset.'); setConfirm(false); refresh(); load(); } catch (e) { toast(e.message, true); } }
  return (
    <>
      <PageTitle title="Team view" lede="For QS One coordinators: which institutions are active, Pulse contribution and community membership, with an activity log." />
      <Panel title="Institution activation" sub="Active = two or more colleagues logged in within 60 days and at least one Pulse answered." action={null}>
        <div className="scroll"><table className="table"><thead><tr><th>Institution</th><th>Plan</th><th>Active colleagues</th><th>Pulse answered</th><th>Status</th></tr></thead><tbody>
          {d.activation.map(a => <tr key={a.id}><td>{a.name}</td><td>{a.tier === 'Free' ? 'Network' : a.tier}</td><td>{a.activeMembers}{a.invited ? ` (+${a.invited} invited)` : ''}</td><td>{a.answered ? 'Yes' : 'No'}</td><td><Tag tone={a.active ? 'green' : 'amber'}>{a.active ? 'Active' : 'Not yet'}</Tag></td></tr>)}
        </tbody></table></div>
      </Panel>
      <ContentAdmin />
      <div className="grid g2">
        <Panel small title="Open Pulse surveys" action={null}>{d.pulses.map(p => <div className="row" key={p.id}><span><strong>{p.title}</strong><span className="meta">{p.responses} institutions</span></span><Tag tone={p.contributionRate >= 25 ? 'green' : 'amber'}>{p.contributionRate}%</Tag></div>)}</Panel>
        <Panel small title="Communities" action={null}>{d.communities.map(c => <div className="row" key={c.id}><span><strong>{c.title}</strong><span className="meta">{c.members} members · {c.institutions} institutions</span></span></div>)}</Panel>
      </div>
      <Panel title="Activity log" action={confirm ? <span className="card-top"><button className="btn sm amber" onClick={reset}>Yes, reset demo data</button><button className="btn sm ghost" onClick={() => setConfirm(false)}>Cancel</button></span> : <button className="btn sm ghost" onClick={() => setConfirm(true)}>Reset demo data</button>}>
        {d.audit.length ? <div className="scroll"><table className="table"><thead><tr><th>When</th><th>Who</th><th>Action</th></tr></thead><tbody>{d.audit.map((a, n) => <tr key={n}><td className="meta">{ago(a.at)}</td><td>{a.name}</td><td>{a.action}{a.detail ? `: ${a.detail}` : ''}</td></tr>)}</tbody></table></div> : <Empty>No activity yet.</Empty>}
      </Panel>
    </>
  );
}
