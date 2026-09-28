import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Link, fmtNumDate, fmtDateTime, until, signed, Tag } from '../ui.jsx';
import { IntelCard } from './Intelligence.jsx';
import { StatusCards } from './Pulse.jsx';
import { Onboarding } from './Membership.jsx';

export default function Overview() {
  const { boot, me, ent } = useApp();
  const [intel, setIntel] = useState(null);
  const [pulse, setPulse] = useState(null);
  const rec = boot.pulses.filter(p => p.series === 'recruitment').sort((a, b) => b.closesAt.localeCompare(a.closesAt));
  const open = rec.find(p => p.status === 'open');
  const latestMine = rec.find(p => p.contributed);
  useEffect(() => {
    api('intel').then(d => setIntel(d.items.filter(i => i.itemType === 'intel'))).catch(() => setIntel([]));
    if (latestMine) api(`pulses/${latestMine.id}`).then(setPulse).catch(() => {});
  }, []);

  const myComms = boot.communities.filter(c => c.isMember && c.kind !== 'Executive Council');
  const sessions = boot.communities.filter(c => c.isMember).flatMap(c => (c.sessions || []).map(s => ({ ...s, community: c }))).filter(s => Date.parse(s.at) > Date.now()).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 3);
  const openSess = boot.openSessions.filter(s => Date.parse(s.at) > Date.now()).sort((a, b) => a.at.localeCompare(b.at));
  const pending = boot.intros.filter(n => n.toId === me.id && n.status === 'requested').length;
  const quota = ent.introsPerQuarter >= 99 ? 'Concierge' : ent.introsPerQuarter ? `${Math.max(0, ent.introsPerQuarter - boot.introsUsed)} of ${ent.introsPerQuarter}` : '–';
  const firstName = me.name.replace(/^(Prof\.|Dr)\s+/, '').split(' ')[0];

  if (ent.kind === 'partner') return (
    <>
      <PageTitle title="Your QS One partner view" lede="Commercial partners reach university leaders who opt in, through labelled sessions, the partner board and aggregated insight on leader priorities." />
      <Panel title="Partner opportunities" action={null}>
        <div className="tiles">
          <Link to="connect/board" className="tile"><span className="t-label">Partner board</span><span className="t-val">Open problems</span><span className="t-sub">Respond with a pilot proposal</span></Link>
          <Link to="connect" className="tile"><span className="t-label">Leaders open to partner contact</span><span className="t-val">{boot.people.filter(p => p.orgType === 'institution').length}</span></Link>
          <Link to="partners" className="tile"><span className="t-label">Leader priorities</span><span className="t-val">Insight</span><span className="t-sub">Aggregated, groups of 5+</span></Link>
          <Link to="communities/open" className="tile"><span className="t-label">Hosted open sessions</span><span className="t-val">{boot.openSessions.filter(s => s.partnerId === boot.org.id).length}</span></Link>
        </div>
      </Panel>
      <div className="notice left grey">Partners never see Pulse results, member discussions or contact details without opt-in. Commercial partner revenue sits outside the £5m institutional target.</div>
    </>
  );

  return (
    <>
      <PageTitle title="Your QS One overview" lede={`Good to see you, ${firstName}. Early signals from peers, expert interpretation and the people facing the same decisions as ${boot.org.name}.`} />
      <Panel title="This month" action={<button className="dots" aria-label="More">•••</button>}>
        {open && <div className="notice">{open.title} closes {fmtNumDate(open.closesAt)}. {open.contributed ? 'Thank you, your institution has contributed.' : 'Only contributors see results.'} Next wave: November 2026</div>}
        <div style={{ height: 24 }} />
        <div className="tiles">
          <Link to="pulse" className="tile"><span className="t-label">Recruitment Pulse</span><span className="t-val">{open?.contributed ? 'Done' : ent.kind === 'staff' ? `${open?.responses}` : 'To do'}</span><span className="t-sub">{open?.responses} institutions · {open?.contributionRate}% contribution</span></Link>
          <Link to="communities" className="tile"><span className="t-label">Communities</span><span className="t-val">{myComms.length || '–'}</span><span className="t-sub">{myComms.length ? `${sessions.length} sessions coming up` : ent.domainCommunities ? 'Choose a community' : 'Open sessions available'}</span></Link>
          <Link to="connect/intros" className="tile"><span className="t-label">Introductions left</span><span className="t-val">{quota}</span><span className="t-sub">{pending ? `${pending} request waiting for you` : 'This quarter'}</span></Link>
          <Link to="connect/summits" className="tile"><span className="t-label">Summit passes</span><span className="t-val">{ent.summitPasses || '–'}</span><span className="t-sub">{ent.summitMatching === 'all' ? 'Matching at every summit' : ent.summitMatching === 'one' ? 'Matching for one summit' : 'Upgrade for summit matching'}</span></Link>
          {ent.kind === 'member' && <Link to="membership" className="tile"><span className="t-label">Set-up</span><span className="t-val">{boot.onboarding.done}/{boot.onboarding.total}</span><span className="t-sub">{boot.onboarding.activation.active ? 'Institution active' : 'Not yet active'}</span></Link>}
        </div>
      </Panel>

      {pulse?.results && !pulse.results.suppressed && pulse.results.cards && (
        <Panel title={`Your recruitment position · ${pulse.wave}`} sub="Your change in deposits by source market, compared with the peer median." action={<Link to="pulse">Full Pulse →</Link>}>
          <StatusCards cards={pulse.results.cards} />
        </Panel>
      )}

      {ent.kind === 'member' && boot.onboarding.done < boot.onboarding.total && (
        <Panel title="Get your institution set up" sub="One set-up for everything in QS One. An institution counts as active with two or more colleagues logging in and at least one Pulse answered." action={<Link to="membership">Open →</Link>}>
          <Onboarding compact />
        </Panel>
      )}

      <Panel title="Intelligence for you" sub="Weekly Signals are free. Monthly domain briefings and executive briefings depend on your plan." action={<Link to="intelligence">All intelligence →</Link>}>
        <div className="grid g3">{(intel || []).slice(0, 3).map(i => <IntelCard key={i.id} item={i} />)}</div>
      </Panel>

      <div className="grid g2">
        <Panel small title="Coming up in your communities" action={<Link to="communities">Communities →</Link>}>
          {sessions.length ? sessions.map(s => (
            <div className="row" key={s.id}><span><strong>{s.title}</strong><span className="meta">{s.community.title} · {fmtDateTime(s.at)} · {until(s.at)}</span></span></div>
          )) : openSess.slice(0, 3).map(s => (
            <div className="row" key={s.id}><span><strong>{s.title}</strong><span className="meta">Open session · {fmtDateTime(s.at)}{s.partnerId ? ' · partner-hosted' : ''}</span></span><Tag>{s.registered ? 'Registered' : 'Open to all'}</Tag></div>
          ))}
        </Panel>
        <Panel small title="Your plan" action={<Link to="membership/plans">Compare →</Link>}>
          <div className="row"><span><strong>{ent.label}</strong><span className="meta">{boot.org.foundingMember ? 'Founding QS One member' : 'Institutional plan'}</span></span></div>
          <div className="row"><span><strong>Intelligence</strong><span className="meta">{ent.intel}</span></span></div>
          <div className="row"><span><strong>Communities</strong><span className="meta">{ent.communities}</span></span></div>
          <div className="row"><span><strong>Pulse</strong><span className="meta">{ent.pulse}</span></span></div>
          <div className="row"><span><strong>Connect</strong><span className="meta">{ent.connect}</span></span></div>
        </Panel>
      </div>
    </>
  );
}
