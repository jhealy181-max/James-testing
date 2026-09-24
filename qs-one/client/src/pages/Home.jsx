import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, Link, Section, fmtDateTime, fmtDate, until, DOMAIN_ICON, Tag, Note } from '../ui.jsx';
import { FeedCard } from './Intelligence.jsx';

export default function Home() {
  const { boot, me, ent } = useApp();
  const [feed, setFeed] = useState(null);
  useEffect(() => { api('feed').then(d => setFeed(d.items)).catch(() => setFeed([])); }, []);

  const firstName = me.name.replace(/^(Prof\.|Dr)\s+/, '').split(' ')[0];
  const myCircles = boot.circles.filter(c => c.isMember);
  const sessions = myCircles.flatMap(c => (c.sessions || []).map(s => ({ ...s, circle: c }))).filter(s => Date.parse(s.at) > Date.now()).sort((a, b) => a.at.localeCompare(b.at));
  const nextEvent = boot.events.filter(e => !e.past).sort((a, b) => a.start.localeCompare(b.start))[0];
  const pendingIntros = boot.intros.filter(n => n.toId === me.id && n.status === 'requested');
  const openPulse = boot.pulses.find(p => !p.contributed);
  const suggested = boot.circles.filter(c => !c.isMember && c.canJoin && (!c.domain || me.interests.includes(c.domain))).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow light">{boot.org?.name} · {ent.label}</div>
          <h1>Good to see you, {firstName}.</h1>
          <p>{ent.kind === 'partner'
            ? 'Your Partner Hub: roundtables you host, challenges from member institutions, and what leaders are prioritising.'
            : ent.kind === 'staff' ? 'The QS One team view: the whole network, source health and activity.'
            : `Your ${me.persona.toLowerCase()} view of QS evidence, peers and the next conversations worth having.`}</p>
          <div className="hero-actions">
            {ent.kind === 'partner'
              ? <><Link to="partners" className="btn primary">Open Partner Hub →</Link><Link to="partners/challenges" className="btn ghost-light">See challenges</Link></>
              : <><Link to="intelligence" className="btn primary">Your intelligence →</Link><Link to="domain/mobility" className="btn ghost-light">Global Student Flows hub</Link></>}
          </div>
        </div>
        {nextEvent && (
          <Link to={`convene/${nextEvent.id}`} className="hero-event">
            <small>Next QS summit · {until(nextEvent.start)}</small>
            <strong>{nextEvent.title}</strong>
            <span>{nextEvent.label} · {nextEvent.place}</span>
            <span className="hero-event-cta">{nextEvent.attending ? 'You are attending · see suggested meetings →' : 'Plan your meetings →'}</span>
          </Link>
        )}
      </section>

      <div className="week">
        <div className="week-card">
          <div className="week-kicker">Next Circle session</div>
          {sessions[0] ? <><Link to={`circles/${sessions[0].circle.id}`} className="week-title">{sessions[0].title}</Link><p>{sessions[0].circle.title} · {fmtDateTime(sessions[0].at)}</p></>
            : <><span className="week-title muted">No sessions booked</span><p>{ent.circles ? <Link to="circles">Find a Circle →</Link> : 'Circles are included from Leadership membership.'}</p></>}
        </div>
        <div className="week-card">
          <div className="week-kicker">Pulse</div>
          {ent.kind === 'partner' ? <><span className="week-title muted">Member-only benchmarks</span><p>Partners see aggregated priorities in the Hub.</p></>
            : openPulse ? <><Link to={`pulse/${openPulse.id}`} className="week-title">{openPulse.title}</Link><p>{openPulse.responses} institutions have answered. Contribute to see results.</p></>
            : <><span className="week-title">All Pulses answered</span><p><Link to="pulse">See your benchmarks →</Link></p></>}
        </div>
        <div className="week-card">
          <div className="week-kicker">Introductions</div>
          {pendingIntros.length ? <><Link to="network/intros" className="week-title">{pendingIntros.length} request{pendingIntros.length > 1 ? 's' : ''} waiting for you</Link><p>From {pendingIntros.map(n => boot.people.find(p => p.id === n.fromId)?.name).join(', ')}</p></>
            : <><span className="week-title muted">Nothing waiting</span><p><Link to="network">Find peers facing the same decision →</Link></p></>}
        </div>
      </div>

      <Section title="For you this week" sub="Ranked by your role and interests. Every item shows its source and whether it was read live." action={<Link to="intelligence">All intelligence →</Link>}>
        {!feed ? <p className="muted">Loading…</p> : <div className="grid three">{feed.slice(0, 6).map(i => <FeedCard key={i.id} item={i} compact />)}</div>}
      </Section>

      <Section title="Four domains" sub="Every Circle, Pulse, briefing and event is tagged to these.">
        <div className="grid four">
          {boot.domains.map(d => (
            <Link key={d.id} to={`domain/${d.id}`} className="domain-card">
              <span className="domain-icon" aria-hidden="true">{DOMAIN_ICON[d.id]}</span>
              <strong>{d.name}</strong>
              <span>{d.question}</span>
              {d.id === 'mobility' && <Tag tone="pink">Global Student Flows hub</Tag>}
            </Link>
          ))}
        </div>
      </Section>

      {ent.kind !== 'partner' && suggested.length > 0 && (
        <Section title="Circles you could join" sub="Matched to your interests." action={<Link to="circles">All Circles →</Link>}>
          <div className="grid three">
            {suggested.map(c => (
              <Link key={c.id} to={`circles/${c.id}`} className="card link-card">
                <div className="card-kicker">{c.type} · {c.memberCount} members</div>
                <strong>{c.title}</strong>
                <p>{c.description}</p>
                <span className="text-link">View Circle →</span>
              </Link>
            ))}
          </div>
        </Section>
      )}
      {ent.kind === 'member' && ent.tier === 'Network' && (
        <Note>Your institution has <b>Network</b> membership: Intelligence, Exchange, Pulse headline results and {ent.introsPerQuarter} introductions a quarter. <Link to="membership">Compare memberships →</Link></Note>
      )}
    </>
  );
}
