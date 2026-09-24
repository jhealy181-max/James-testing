import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, Section, SourceBadge, Link, Ext, Empty, Note, Tag, DOMAIN_ICON, fmtDate, until, Bars } from '../ui.jsx';
import { FeedCard } from './Intelligence.jsx';

// Descriptions follow QS's public Global Student Flows pages; the live source panel below shows the current page text.
const SCENARIOS = [
  { name: 'Regulated Regionalism', tone: 'a', text: 'Stricter national frameworks concentrate mobility within regions. Traditional anglophone destinations face tighter limits while hubs in Asia and the Middle East gain share.', ask: 'Which of your source markets depend on a destination policy you cannot influence?' },
  { name: 'Hybrid Multiversity', tone: 'b', text: 'Digitally enabled models blend local, online and short international phases as students look for flexible, lower-cost routes.', ask: 'Could part of your portfolio be delivered as a hybrid or TNE pathway?' },
  { name: 'Talent Race Rebound', tone: 'c', text: 'Countries compete for international students as future workers, with structured post-study and immigration pathways.', ask: 'Are your outcomes and employer links strong enough to win on work rights?' }
];
const FIGURES = [
  { n: '~4%', l: 'estimated annual growth in demand for international education this decade', src: 'gsf-report' },
  { n: '~8.5m', l: 'internationally mobile students projected by 2030', src: 'gsf-report' },
  { n: '80+', l: 'sending and receiving markets forecast to 2030', src: 'recruitment-datasets' },
  { n: '15', l: 'drivers grouped into push, pull and disruption factors', src: 'gsf-hub' }
];

export default function DomainHub({ id }) {
  const { boot, ent } = useApp();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(null);
  useEffect(() => {
    api(`domains/${id}`).then(setD).catch(e => setErr(e.message));
    if (id === 'mobility') api('pulses/q1').then(setPulse).catch(() => {});
  }, [id]);
  if (err) return <Empty>{err}</Empty>;
  if (!d) return <p className="muted">Loading…</p>;
  const src = Object.fromEntries(d.sources.map(s => [s.id, s]));
  const isMobility = id === 'mobility';
  const scenarioQ = pulse?.results?.questions?.find(q => q.id === 'scenario');

  return (
    <>
      <section className={`domain-hero ${id}`}>
        <div className="domain-hero-top">
          <span className="domain-icon big" aria-hidden="true">{DOMAIN_ICON[id]}</span>
          <nav className="domain-switch" aria-label="Domains">{boot.domains.map(x => <Link key={x.id} to={`domain/${x.id}`} className={x.id === id ? 'on' : ''}>{x.short}</Link>)}</nav>
        </div>
        <div className="eyebrow light">{isMobility ? 'Recruitment · Global Student Flows hub' : 'Domain hub'}</div>
        <h1>{d.domain.name}</h1>
        <p>{d.domain.question}</p>
        <div className="tags">{d.domain.topics.map(t => <span key={t} className="tag light">{t}</span>)}</div>
      </section>

      {isMobility && (
        <>
          <Section title="Three scenarios to 2030" sub="From QS Global Student Flows. Use them to stress-test your recruitment plan, not to predict a single future." action={src['gsf-report'] && <Ext href={src['gsf-report'].url}>Read the QS report ↗</Ext>}>
            <div className="grid three">
              {SCENARIOS.map(s => (
                <article key={s.name} className={`card scenario ${s.tone}`}>
                  <div className="card-kicker">Scenario</div>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                  <p className="scenario-ask"><b>Ask your team:</b> {s.ask}</p>
                  {scenarioQ && <div className="scenario-peers">{scenarioQ.options.find(o => o.option === s.name)?.pct ?? 0}% of Pulse respondents use this as their base case</div>}
                </article>
              ))}
            </div>
            <div className="figures">
              {FIGURES.map(f => (
                <div className="figure" key={f.n}>
                  <strong>{f.n}</strong><span>{f.l}</span>
                  {src[f.src] && <Ext href={src[f.src].url} className="fig-src">Source: {src[f.src].title} ↗</Ext>}
                </div>
              ))}
            </div>
            <Note>Figures are as published on QS’s public pages. Market-level forecasts and survey cuts are licensed through <Ext href={src['recruitment-datasets']?.url}>QS Student Recruitment Datasets ↗</Ext> and are not reproduced in QS One.</Note>
          </Section>

          <Section title="What peers are planning for" sub="From the QS One Pulse on 2027 recruitment. Results unlock when your institution contributes." action={<Link to="pulse/q1">{pulse?.contributed ? 'Full results →' : 'Contribute →'}</Link>}>
            {ent.kind === 'partner' ? <Empty>Pulse results are for contributing member institutions.</Empty>
              : pulse?.results && !pulse.results.suppressed ? (
                <div className="grid two">
                  {pulse.results.questions.filter(q => ['deposits', 'risk'].includes(q.id)).map(q => (
                    <div className="card" key={q.id}><div className="card-kicker">Pulse · n={pulse.results.n}</div><h3 className="small">{q.text}</h3><Bars options={q.options} highlight={[].concat(pulse.myAnswers?.[q.id] || [])} /></div>
                  ))}
                </div>
              ) : (
                <div className="locked-panel">
                  <strong>{pulse?.responses ?? '…'} institutions have answered the 2027 recruitment Pulse.</strong>
                  <p>Answer five questions (about two minutes) to see how peers’ deposits, market priorities and risks compare with yours.</p>
                  <Link to="pulse/q1" className="btn primary">Contribute and see results</Link>
                </div>
              )}
          </Section>
        </>
      )}

      <Section title="From QS" sub="Public QS pages for this domain, read by the QS One source service. Each shows whether it was read live or from a saved copy." action={<Link to="sources">Source status →</Link>}>
        <div className="source-list">
          {d.sources.map(s => (
            <article className="source-item" key={s.id}>
              <div className="source-main">
                <div className="feed-top"><span className="trust evidence">QS Evidence</span><span className="kind">{s.kind}</span></div>
                <h3><a className="plain" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></h3>
                <p>{s.summary}</p>
                {s.excerpts?.slice(0, isMobility && s.priority === 1 ? 4 : 2).map((x, n) => <blockquote className="excerpt" key={n}>{x}</blockquote>)}
              </div>
              <div className="source-side"><SourceBadge status={s.status} asOf={s.asOf} /><Ext href={s.url} /></div>
            </article>
          ))}
        </div>
        {d.listing.length > 0 && (
          <>
            <h3 className="sub-h">Latest on QS Insights <span className="src-badge live">● live</span></h3>
            <ul className="listing">{d.listing.map(l => <li key={l.url}><Ext href={l.url}>{l.title} ↗</Ext></li>)}</ul>
          </>
        )}
      </Section>

      {d.briefings.length > 0 && (
        <Section title="QS analysis" sub="Signals, briefings and frameworks for this domain.">
          <div className="grid three">{d.briefings.map(b => <FeedCard key={b.id} item={b} compact />)}</div>
        </Section>
      )}

      <div className="grid two">
        <Section title="Circles" action={<Link to="circles">All →</Link>}>
          {d.circles.length ? d.circles.map(c => (
            <Link key={c.id} to={`circles/${c.id}`} className="row-link">
              <span><strong>{c.title}</strong><em>{c.type} · {c.memberCount} members · {c.cadence}</em></span>
              {c.isMember ? <Tag tone="teal">Member</Tag> : <span className="text-link">View →</span>}
            </Link>
          )) : <Empty>No Circles yet.</Empty>}
        </Section>
        <Section title="At QS events" action={<Link to="convene">Convene →</Link>}>
          {d.events.filter(e => !e.past).map(e => (
            <Link key={e.id} to={`convene/${e.id}`} className="row-link">
              <span><strong>{e.title}</strong><em>{e.label} · {e.place}</em></span>
              <span className="meta">{until(e.start)}</span>
            </Link>
          ))}
        </Section>
      </div>

      {d.challenges.length > 0 && (
        <Section title="Challenges from members" sub="Problems institutions have posted for partners to propose pilots." action={<Link to="partners/challenges">Challenge Board →</Link>}>
          {d.challenges.map(c => <Link key={c.id} to="partners/challenges" className="row-link"><span><strong>{c.title}</strong><em>{c.status} · posted {fmtDate(c.createdAt)}</em></span><span className="text-link">View →</span></Link>)}
        </Section>
      )}
    </>
  );
}
