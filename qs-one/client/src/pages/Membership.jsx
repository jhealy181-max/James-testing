import React from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Note, Tag } from '../ui.jsx';

const INST_FEATURES = {
  Network: ['Intelligence and QS source feed for all leaders', 'Member Exchange: read and post', 'Pulse: contribute and see headline results', 'Directory and 2 introductions a quarter'],
  Leadership: ['Everything in Network', 'Domain Circles and a Regional Chapter', 'Pulse cohort cuts by region and type', 'Closed roundtables at QS summits', '4 summit passes a year'],
  Council: ['Everything in Leadership', 'Executive Council seat for the head of institution', 'Private Peer Circle with a QS facilitator', 'Bespoke benchmark cohort', '10 summit passes; 20 analyst hours']
};
const CHARTER = [
  ['No bearing on rankings', 'Membership, tier, Circle participation and partner status have no bearing on any QS ranking, survey or methodology decision.'],
  ['Contributed data is ring-fenced', 'Pulse data is used only for member benchmarks unless separate, specific consent is given.'],
  ['Partner content is always labelled', 'Partner material is never presented as QS analysis. QS keeps editorial control of co-developed research.'],
  ['Members control contact', 'No partner contact without opt-in. No personal data is sold. Introductions need both sides’ consent.'],
  ['Every claim shows its source', 'Source, date, author type and cohort size are shown on every item.'],
  ['Independent oversight', 'An annual review by a panel including independent members, with published findings.']
];
const gbp = n => '£' + (n >= 1000 ? `${Math.round(n / 1000)}k` : n);

export default function Membership() {
  const { boot, ent, me, toast, refresh } = useApp();
  async function switchTier(t) {
    try { await api(`institutions/${me.orgId}`, { method: 'PATCH', body: { tier: t } }); toast(`Demo: ${boot.org.name} switched to ${t}. Try Circles and Pulse to see the difference.`); refresh(); } catch (e) { toast(e.message, true); }
  }
  return (
    <>
      <PageHead eyebrow="Membership" title="QS One membership" intro="Priced for the whole institution, not per seat. Tiers differ by how deeply you take part, not by how much you can read. All prices are illustrative and being tested in the pilot." />
      <h2 className="sub-h">For institutions</h2>
      <div className="grid three">
        {Object.entries(boot.tiers).map(([name, t]) => (
          <article key={name} className={`card price-card ${name === 'Leadership' ? 'featured' : ''} ${ent.tier === name ? 'current' : ''}`}>
            <div className="feed-top"><Tag tone={name === 'Leadership' ? 'pink' : ''}>{name === 'Leadership' ? 'Core offer' : name}</Tag>{ent.tier === name && <Tag tone="teal">Your institution</Tag>}</div>
            <h3>{name}</h3>
            <div className="price">{gbp(t.price)} <span>/ institution / year</span></div>
            <ul>{INST_FEATURES[name].map(x => <li key={x}>{x}</li>)}</ul>
            {ent.kind === 'member' && ent.tier !== name && <button className="btn small ghost" onClick={() => switchTier(name)}>Demo: switch to {name}</button>}
          </article>
        ))}
      </div>
      <div className="grid two" style={{ marginTop: 14 }}>
        <article className="card"><Tag tone="teal">System & consortium</Tag><div className="price">From £150k <span>/ year</span></div><p>Ministries, agencies and alliances: membership for a cohort, a private network space and system benchmarks.</p></article>
        <article className="card"><Tag tone="teal">Individual Fellow</Tag><div className="price">£1.2k <span>/ person / year</span></div><p>For leaders whose institution is not yet a member. Credited against an institutional upgrade.</p></article>
      </div>

      <h2 className="sub-h">For partners</h2>
      <div className="grid three">
        {Object.entries(boot.partnerTiers).map(([name, t]) => (
          <article key={name} className={`card price-card ${name === 'Domain' ? 'featured' : ''} ${ent.tier === name && ent.kind === 'partner' ? 'current' : ''}`}>
            <div className="feed-top"><span className="trust partner">Partner</span>{ent.kind === 'partner' && ent.tier === name && <Tag tone="teal">Your package</Tag>}</div>
            <h3>{name} Partner</h3>
            <div className="price">From {gbp(t.price)} <span>/ year</span></div>
            <p>{t.summary}</p>
            <p className="meta">{boot.partnerQuota[name]} labelled partner briefing{boot.partnerQuota[name] > 1 ? 's' : ''} a quarter</p>
          </article>
        ))}
      </div>

      <section className="section charter" id="charter">
        <div className="section-head"><div><h2>Independence Charter</h2><p>Published, and applies to members, partners and QS staff alike.</p></div></div>
        <ol className="charter-list">{CHARTER.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}</ol>
      </section>
      <Note>Proof of concept: no payments are taken and the tier switch above exists only to demonstrate how access changes.</Note>
    </>
  );
}
