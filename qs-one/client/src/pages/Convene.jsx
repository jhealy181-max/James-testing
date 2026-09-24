import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Link, Tag, Note, Empty, Avatar, Ext, DomainTags, until } from '../ui.jsx';
import { IntroButton } from './Network.jsx';

const CYCLE = [
  ['Prime', '6 weeks before', 'Suggested meetings, pre-reads and Pulse questions'],
  ['Convene', 'At the summit', 'Member lounge, closed roundtables, live Pulse'],
  ['Capture', '2 weeks after', 'Digest, recordings, follow-up on introductions'],
  ['Sustain', 'Between summits', 'Circles and virtual roundtables keep it going']
];

function Matches({ eventId }) {
  const [m, setM] = useState(null);
  useEffect(() => { api(`events/${eventId}/matches`).then(setM); }, [eventId]);
  if (!m) return <p className="muted">Finding people…</p>;
  if (!m.matches.length) return <Empty>No other members have marked this event yet.</Empty>;
  return (
    <div className="grid three">
      {m.matches.map(({ person, reasons }) => (
        <article className="card match" key={person.id}>
          <div className="person-top"><Avatar name={person.name} kind={person.orgType} /><div><strong>{person.name}</strong><span className="meta">{person.title} · {person.orgName}</span></div></div>
          <ul className="reasons">{reasons.map(r => <li key={r}>{r}</li>)}</ul>
          <div className="card-foot"><span /><IntroButton person={person} context={m.event.title} label="Suggest a meeting" /></div>
        </article>
      ))}
    </div>
  );
}

export default function Convene({ eventId }) {
  const { boot, toast, refresh, ent } = useApp();
  const events = [...boot.events].sort((a, b) => a.start.localeCompare(b.start));
  const selected = events.find(e => e.id === eventId) || events.find(e => !e.past) || events[0];
  async function attend(e) {
    try { await api(`events/${e.id}/attend`, { method: 'POST' }); toast(e.attending ? 'Removed from your summit plan.' : 'Added to your summit plan. Suggested meetings updated.'); refresh(); } catch (err) { toast(err.message, true); }
  }
  async function rsvp(r) {
    try { await api(`roundtables/${r.id}/rsvp`, { method: 'POST' }); toast(r.going ? 'Place released.' : 'Place reserved. (Demo: no calendar invite is sent.)'); refresh(); } catch (err) { toast(err.message, true); }
  }
  const rts = boot.roundtables.filter(r => r.eventId === selected.id);
  return (
    <>
      <PageHead eyebrow="QS convening" title="Convene" intro="QS summits as part of a year-round cycle: plan who to meet, reserve closed roundtables, and carry the conversation on in Circles." />
      <div className="cycle">{CYCLE.map(([t, w, d], n) => <div className="cycle-step" key={t}><span className="cycle-n">{n + 1}</span><strong>{t}</strong><em>{w}</em><span>{d}</span></div>)}</div>

      <div className="event-tabs" role="tablist">
        {events.map(e => (
          <a key={e.id} href={`#/convene/${e.id}`} className={`event-tab ${e.id === selected.id ? 'on' : ''} ${e.past ? 'past' : ''}`} role="tab" aria-selected={e.id === selected.id}>
            <small>{e.label}</small><strong>{e.title.replace('QS Higher Ed Summit: ', '')}</strong>{e.attending && <span className="dot" title="Attending" />}
          </a>
        ))}
      </div>

      <section className="card event-panel">
        <div className="event-main">
          <div className="card-kicker">{selected.past ? 'Past event' : `Starts ${until(selected.start)}`} · QS One moment: {selected.moment}</div>
          <h2>{selected.title}</h2>
          <p className="meta">{selected.label} · {selected.place}</p>
          {selected.dateNote && <Note tone="warn">{selected.dateNote}</Note>}
          <div className="tags"><DomainTags ids={selected.domains} /></div>
        </div>
        <div className="event-side">
          <button className={`btn ${selected.attending ? 'ghost' : 'primary'}`} onClick={() => attend(selected)} disabled={selected.past}>{selected.attending ? '✓ Attending' : 'I’m attending'}</button>
          <Ext href={selected.url}>Official page and booking ↗</Ext>
          <span className="meta">{selected.attendeeCount} QS One members attending</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Roundtables at this event</h2><p>Small, closed sessions. QS-hosted sessions follow the Chatham House rule; partner-hosted sessions are labelled.</p></div></div>
        {rts.length ? <div className="grid two">{rts.map(r => (
          <article className={`card ${r.hostType === 'partner' ? 'partner-post' : ''}`} key={r.id}>
            <div className="feed-top">{r.hostType === 'partner' ? <span className="trust partner">Partner</span> : <span className="trust analysis">QS One</span>}<span className="kind">Hosted by {r.host}</span></div>
            <h3>{r.title}</h3>
            <p>{r.note}</p>
            <div className="capacity"><span style={{ width: `${(100 * r.taken) / r.capacity}%` }} /></div>
            <div className="card-foot"><span className="meta">{r.taken} of {r.capacity} places · {r.minTier}+</span>
              {ent.kind === 'partner' ? <span className="meta">Members reserve places</span> : r.canRsvp || r.going ? <button className={`btn small ${r.going ? 'ghost' : 'primary'}`} onClick={() => rsvp(r)}>{r.going ? 'Release place' : 'Reserve place'}</button> : <span className="locked">🔒 {r.whyNot}</span>}
            </div>
          </article>
        ))}</div> : <Empty>Roundtables for this event have not been announced yet.</Empty>}
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Suggested meetings</h2><p>{selected.attending ? 'Other attendees matched on your interests, regions and what your institutions are open to.' : 'Mark yourself as attending to get suggestions. Showing people already attending.'}</p></div></div>
        <Matches eventId={selected.id} key={selected.id + boot.events.map(e => e.attendeeCount).join()} />
      </section>
      <Note>Summit passes: your membership includes {ent.summitPasses ?? 0} a year. Booking is on the official QS event page.</Note>
    </>
  );
}
