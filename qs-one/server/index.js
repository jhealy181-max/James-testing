// QS One proof of concept: API + static file server. Node 18+ standard library only.
// Demo identity comes from the "x-demo-user" header set by the persona switcher.
// This is NOT authentication. Do not enter real personal or confidential data.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { load, reset, save, id } from './store.js';
import * as store from './store.js';
import { DOMAINS, TIERS, PARTNER_TIERS } from './seed.js';
import { startScheduler, refreshAll, getSources, getListing, getStatus } from './sources.js';

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.resolve('public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };
const PARTNER_POST_QUOTA = { Insight: 1, Domain: 3, Principal: 6 };
const DAY = 864e5;

load();
const db = () => store.db;

// ---------- helpers ----------
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
const str = (v, max = 500, min = 0, label = 'Text') => {
  const s = String(v ?? '').trim();
  if (s.length < min) fail(400, `${label} needs at least ${min} characters.`);
  return s.slice(0, max);
};
const domainsOf = v => (Array.isArray(v) ? v : []).filter(d => DOMAINS.some(x => x.id === d)).slice(0, 4);
const now = () => new Date().toISOString();
const person = pid => db().people.find(p => p.id === pid);
const inst = iid => db().institutions.find(i => i.id === iid);
const partner = pid => db().partners.find(p => p.id === pid);
const orgOf = p => (p.orgType === 'institution' ? inst(p.orgId) : p.orgType === 'partner' ? partner(p.orgId) : { id: 'qs', name: 'QS Quacquarelli Symonds' });
const tierOf = p => (p.orgType === 'institution' ? inst(p.orgId)?.tier : null);
const rank = t => TIERS[t]?.rank || 0;
const isStaff = p => p.role === 'staff';
const isPartner = p => p.orgType === 'partner';
const isMember = p => p.orgType === 'institution';
const audit = (who, action, detail = '') => { db().audit.unshift({ at: now(), who: who.id, name: who.name, action, detail }); db().audit.length = Math.min(db().audit.length, 300); };

function pub(p) {
  const o = orgOf(p);
  return { id: p.id, name: p.name, title: p.title, persona: p.persona, orgType: p.orgType, orgId: p.orgId, orgName: o?.name, country: o?.country, region: o?.region, interests: p.interests, regions: p.regions, partnerContact: p.partnerContact, bio: p.bio, role: p.role, newsletter: p.newsletter };
}

function entitlements(me) {
  if (isStaff(me)) return { kind: 'staff', label: 'QS team', circles: true, cohortCuts: true, peerCircles: true, roundtables: true, pulse: true, exchange: true, partnerHub: true, insights: true };
  if (isPartner(me)) {
    const t = partner(me.orgId).tier;
    return { kind: 'partner', label: `${t} Partner`, tier: t, circles: false, cohortCuts: false, peerCircles: false, roundtables: false, pulse: false, exchange: false, partnerHub: true, insights: PARTNER_TIERS[t].insights, postQuota: PARTNER_POST_QUOTA[t] };
  }
  const t = tierOf(me);
  return { kind: 'member', label: `${t} member`, tier: t, ...TIERS[t], pulse: true, exchange: true, partnerHub: true, insights: false };
}

function introsThisQuarter(me) { return db().intros.filter(n => n.fromId === me.id && Date.now() - Date.parse(n.createdAt) < 90 * DAY).length; }

function circleView(c, me) {
  const ent = entitlements(me);
  const isIn = c.members.includes(me.id);
  let canJoin = false, why = '';
  if (isStaff(me)) canJoin = true;
  else if (!isMember(me)) why = 'Circles are for member institutions. Partners take part through hosted roundtables.';
  else if (c.invitationOnly) why = rank(ent.tier) >= rank(c.minTier) ? 'Invitation only. Ask the coordinator for a place.' : `Invitation only, for ${c.minTier} members.`;
  else if (rank(ent.tier) < rank(c.minTier)) why = `${c.minTier} membership or above is needed to join.`;
  else canJoin = true;
  return { ...c, memberCount: c.members.length, isMember: isIn, canJoin, whyNot: why, members: undefined, memberIds: c.members };
}

function eventView(e, me) {
  return { ...e, attending: e.attendees.includes(me.id), attendeeCount: e.attendees.length, attendees: undefined, past: Date.parse(e.start) + 3 * DAY < Date.now() };
}

function roundtableView(r, me) {
  const ent = entitlements(me);
  let can = true, why = '';
  if (isPartner(me)) { can = false; why = 'Partners host roundtables; members attend.'; }
  else if (!isStaff(me) && rank(ent.tier) < rank(r.minTier)) { can = false; why = `${r.minTier} membership or above.`; }
  return { ...r, going: r.rsvps.includes(me.id), taken: r.rsvps.length, rsvps: undefined, canRsvp: can, whyNot: why };
}

// ---------- ranking content for a person ----------
function feedFor(me) {
  const sources = getSources();
  const byId = Object.fromEntries(sources.map(s => [s.id, s]));
  const items = [];
  for (const b of db().briefings) items.push({ ...b, itemType: 'briefing', sources: (b.sourceIds || []).map(i => byId[i]).filter(Boolean).map(s => ({ id: s.id, title: s.title, url: s.url, status: s.status, asOf: s.asOf })) });
  for (const s of sources.filter(s => s.domain !== 'events')) items.push({ id: `src-${s.id}`, itemType: 'source', label: 'QS Evidence', kind: s.kind, title: s.title, summary: s.summary, domains: [s.domain], audiences: [], published: s.asOf, url: s.url, status: s.status, asOf: s.asOf, excerpts: s.excerpts.slice(0, 2), priority: s.priority });
  for (const l of getListing()) items.push({ id: `lst-${l.url}`, itemType: 'listing', label: 'QS Evidence', kind: 'QS Insights article', title: l.title, summary: 'New on QS Insights. Open the article on qs.com.', domains: [l.domain], audiences: [], published: l.fetchedAt, url: l.url, status: 'live', asOf: l.fetchedAt });
  const interests = me.interests || [];
  return items.map(it => {
    const reasons = [];
    let score = 0;
    const overlap = it.domains.filter(d => interests.includes(d));
    if (overlap.length) { score += 3 + (overlap.length - 1); reasons.push(`Your interest: ${overlap.map(d => DOMAINS.find(x => x.id === d).short).join(', ')}`); }
    if (it.audiences?.includes(me.persona)) { score += 4; reasons.push(`For ${me.persona.toLowerCase()} leaders`); }
    const age = (Date.now() - Date.parse(it.published)) / DAY;
    if (age < 7) { score += 2; reasons.push('New this week'); }
    if (it.itemType === 'briefing') score += 1.5;
    if (it.itemType === 'source') score += (5 - (it.priority || 4)) * 0.5;
    if (!reasons.length) reasons.push('Across your domains');
    return { ...it, score, reasons };
  }).sort((a, b) => b.score - a.score || String(b.published).localeCompare(String(a.published)));
}

// ---------- Pulse ----------
function pulseResults(p, filter) {
  let rs = db().responses.filter(r => r.pulseId === p.id);
  if (filter?.region) rs = rs.filter(r => inst(r.institutionId)?.region === filter.region);
  if (filter?.type) rs = rs.filter(r => inst(r.institutionId)?.type === filter.type);
  const n = rs.length;
  if (n < p.minCohort) return { n, suppressed: true, questions: [] };
  return {
    n, suppressed: false, demoShare: rs.filter(r => r.demo).length,
    questions: p.questions.map(q => {
      const counts = Object.fromEntries(q.options.map(o => [o, 0]));
      for (const r of rs) for (const a of [].concat(r.answers[q.id] || [])) if (a in counts) counts[a]++;
      return { id: q.id, text: q.text, type: q.type, options: q.options.map(o => ({ option: o, count: counts[o], pct: Math.round((100 * counts[o]) / n) })) };
    })
  };
}

function pulseView(p, me, filter) {
  const myInst = isMember(me) ? me.orgId : null;
  const mine = myInst && db().responses.find(r => r.pulseId === p.id && r.institutionId === myInst);
  const n = db().responses.filter(r => r.pulseId === p.id).length;
  const out = { ...p, responses: n, contributed: !!mine, myAnswers: mine?.answers || null };
  const ent = entitlements(me);
  if (isPartner(me)) out.locked = 'Pulse results are only for contributing member institutions.';
  else if (!mine && !isStaff(me)) out.locked = 'Contribute your institution’s answers to see results.';
  else {
    const f = filter && (filter.region || filter.type) ? filter : null;
    if (f && !ent.cohortCuts) out.cohortLocked = 'Cohort cuts are included from Leadership membership.';
    out.results = pulseResults(p, f && ent.cohortCuts ? f : null);
    out.filter = f && ent.cohortCuts ? f : null;
  }
  return out;
}

// ---------- routes ----------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler });

route('GET', '/api/health', () => ({ ok: true, app: 'QS One', mode: 'proof of concept', time: now() }));

route('GET', '/api/bootstrap', ({ me }) => {
  const ent = entitlements(me);
  const d = db();
  const visibleInst = d.institutions.filter(i => i.visible || i.id === me.orgId || isStaff(me));
  let people = d.people.filter(p => p.orgType !== 'qs' || isStaff(me));
  if (isPartner(me)) people = people.filter(p => p.partnerContact || p.orgType === 'partner');
  people = people.filter(p => p.orgType !== 'institution' || visibleInst.some(i => i.id === p.orgId));
  return {
    me: pub(me), org: orgOf(me), entitlements: ent,
    personas: d.personas.map(pid => { const p = person(pid); return { id: p.id, name: p.name, title: p.title, orgName: orgOf(p).name, label: entitlements(p).label }; }),
    domains: DOMAINS, tiers: TIERS, partnerTiers: PARTNER_TIERS, partnerQuota: PARTNER_POST_QUOTA,
    institutions: visibleInst, partners: d.partners, people: people.map(pub),
    circles: d.circles.map(c => circleView(c, me)),
    events: d.events.map(e => eventView(e, me)),
    roundtables: d.roundtables.map(r => roundtableView(r, me)),
    intros: d.intros.filter(n => n.fromId === me.id || n.toId === me.id),
    introsUsed: introsThisQuarter(me),
    pulses: d.pulses.map(p => ({ id: p.id, title: p.title, domain: p.domain, closesAt: p.closesAt, responses: d.responses.filter(r => r.pulseId === p.id).length, contributed: isMember(me) && d.responses.some(r => r.pulseId === p.id && r.institutionId === me.orgId) })),
    sourceStatus: getStatus()
  };
});

route('GET', '/api/feed', ({ me }) => ({ items: feedFor(me) }));

route('GET', '/api/briefings/:id', ({ me, params }) => {
  const b = feedFor(me).find(i => i.id === params.id && i.itemType === 'briefing');
  if (!b) fail(404, 'Briefing not found.');
  return b;
});

route('GET', '/api/domains/:id', ({ me, params }) => {
  const d = DOMAINS.find(x => x.id === params.id) || fail(404, 'Domain not found.');
  const all = feedFor(me);
  return {
    domain: d,
    sources: getSources().filter(s => s.domain === d.id).sort((a, b) => a.priority - b.priority),
    briefings: all.filter(i => i.itemType === 'briefing' && i.domains.includes(d.id)),
    listing: getListing().filter(l => l.domain === d.id).slice(0, 8),
    circles: db().circles.filter(c => c.domain === d.id).map(c => circleView(c, me)),
    pulses: db().pulses.filter(p => p.domain === d.id).map(p => pulseView(p, me)),
    events: db().events.filter(e => e.domains.includes(d.id)).map(e => eventView(e, me)),
    challenges: db().challenges.filter(c => c.domain === d.id)
  };
});

route('GET', '/api/sources', () => ({ sources: getSources(), listing: getListing(), status: getStatus() }));
route('POST', '/api/sources/refresh', ({ me }) => { const r = refreshAll({ reason: `manual (${me.name})` }); audit(me, 'Refreshed QS sources'); save(); return r; });

// Exchange
route('GET', '/api/posts', ({ me, query }) => {
  let posts = db().posts.slice();
  if (isPartner(me)) posts = posts.filter(p => p.type === 'Partner briefing');
  posts = posts.filter(p => !p.circleId || isStaff(me) || db().circles.find(c => c.id === p.circleId)?.members.includes(me.id));
  if (query.circle) posts = posts.filter(p => p.circleId === query.circle);
  if (query.type) posts = posts.filter(p => p.type === query.type);
  if (query.domain) posts = posts.filter(p => p.domains.includes(query.domain));
  return { posts: posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(p => ({ ...p, author: pub(person(p.authorId)), replies: p.replies.map(r => ({ ...r, author: pub(person(r.authorId)) })), circleTitle: db().circles.find(c => c.id === p.circleId)?.title })) };
});

route('POST', '/api/posts', ({ me, body }) => {
  const type = body.type;
  if (!['Practice note', 'Question', 'Partner briefing'].includes(type)) fail(400, 'Choose a post type.');
  if (type === 'Partner briefing') {
    if (!isPartner(me)) fail(403, 'Only partners publish partner briefings.');
    const t = partner(me.orgId).tier;
    const used = db().posts.filter(p => p.partnerId === me.orgId && Date.now() - Date.parse(p.createdAt) < 90 * DAY).length;
    if (used >= PARTNER_POST_QUOTA[t]) fail(403, `Your ${t} package includes ${PARTNER_POST_QUOTA[t]} partner briefing${PARTNER_POST_QUOTA[t] > 1 ? 's' : ''} per quarter, and it has been used.`);
  } else if (!isMember(me) && !isStaff(me)) fail(403, 'The Exchange is for member institutions. Partners publish labelled partner briefings.');
  const circleId = body.circleId || null;
  if (circleId && !isStaff(me) && !db().circles.find(c => c.id === circleId)?.members.includes(me.id)) fail(403, 'Join this Circle to post in it.');
  const post = { id: id('x'), type, authorId: me.id, circleId, domains: domainsOf(body.domains), createdAt: now(), title: str(body.title, 160, 8, 'Title'), body: str(body.body, 4000, 20, 'Your post'), replies: [], upvotes: [], partnerId: isPartner(me) ? me.orgId : undefined };
  if (!post.domains.length) fail(400, 'Tag at least one domain.');
  db().posts.push(post); audit(me, `Posted ${type.toLowerCase()}`, post.title); save();
  return post;
});

route('POST', '/api/posts/:id/replies', ({ me, params, body }) => {
  const p = db().posts.find(x => x.id === params.id) || fail(404, 'Post not found.');
  if (isPartner(me) && p.partnerId !== me.orgId) fail(403, 'Partners can reply only to their own briefings.');
  const r = { id: id('y'), authorId: me.id, body: str(body.body, 2000, 2, 'Reply'), createdAt: now() };
  p.replies.push(r); audit(me, 'Replied', p.title); save();
  return r;
});

route('POST', '/api/posts/:id/upvote', ({ me, params }) => {
  const p = db().posts.find(x => x.id === params.id) || fail(404, 'Post not found.');
  p.upvotes = p.upvotes.includes(me.id) ? p.upvotes.filter(u => u !== me.id) : [...p.upvotes, me.id];
  save(); return { upvotes: p.upvotes.length, mine: p.upvotes.includes(me.id) };
});

// Pulse
route('GET', '/api/pulses/:id', ({ me, params, query }) => {
  const p = db().pulses.find(x => x.id === params.id) || fail(404, 'Pulse not found.');
  const regions = [...new Set(db().institutions.map(i => i.region))].sort();
  const types = [...new Set(db().institutions.map(i => i.type))].sort();
  return { ...pulseView(p, me, { region: query.region || null, type: query.type || null }), regions, types };
});

route('POST', '/api/pulses/:id/responses', ({ me, params, body }) => {
  const p = db().pulses.find(x => x.id === params.id) || fail(404, 'Pulse not found.');
  if (!isMember(me)) fail(403, 'Only member institutions contribute to Pulse.');
  const answers = {};
  for (const q of p.questions) {
    const a = body.answers?.[q.id];
    if (q.type === 'multi') {
      const arr = (Array.isArray(a) ? a : []).filter(x => q.options.includes(x));
      if (!arr.length) fail(400, `Answer: “${q.text}”`);
      if (arr.length > (q.max || 99)) fail(400, `Choose up to ${q.max} for “${q.text}”.`);
      answers[q.id] = [...new Set(arr)];
    } else {
      if (!q.options.includes(a)) fail(400, `Answer: “${q.text}”`);
      answers[q.id] = a;
    }
  }
  const existing = db().responses.find(r => r.pulseId === p.id && r.institutionId === me.orgId);
  if (existing) Object.assign(existing, { answers, personId: me.id, createdAt: now(), demo: false });
  else db().responses.push({ id: id('pr'), pulseId: p.id, institutionId: me.orgId, personId: me.id, answers, demo: false, createdAt: now() });
  audit(me, existing ? 'Updated Pulse response' : 'Contributed to Pulse', p.title); save();
  return pulseView(p, me);
});

// Circles
route('GET', '/api/circles/:id', ({ me, params }) => {
  const c = db().circles.find(x => x.id === params.id) || fail(404, 'Circle not found.');
  return { ...circleView(c, me), members: c.members.map(pid => pub(person(pid))) };
});
route('POST', '/api/circles/:id/join', ({ me, params }) => {
  const c = db().circles.find(x => x.id === params.id) || fail(404, 'Circle not found.');
  const v = circleView(c, me);
  if (!v.canJoin) fail(403, v.whyNot);
  if (!c.members.includes(me.id)) c.members.push(me.id);
  audit(me, 'Joined Circle', c.title); save(); return circleView(c, me);
});
route('DELETE', '/api/circles/:id/join', ({ me, params }) => {
  const c = db().circles.find(x => x.id === params.id) || fail(404, 'Circle not found.');
  c.members = c.members.filter(m => m !== me.id);
  audit(me, 'Left Circle', c.title); save(); return circleView(c, me);
});
route('POST', '/api/circles/:id/request', ({ me, params, body }) => {
  const c = db().circles.find(x => x.id === params.id) || fail(404, 'Circle not found.');
  if (!isMember(me)) fail(403, 'Circles are for member institutions.');
  audit(me, 'Requested a Circle place', `${c.title}: ${str(body.note, 400)}`); save();
  return { ok: true };
});

// Introductions
route('POST', '/api/intros', ({ me, body }) => {
  const to = person(body.toId) || fail(404, 'Person not found.');
  if (to.id === me.id) fail(400, 'You cannot request an introduction to yourself.');
  if (to.orgType === 'qs') fail(400, 'Contact the QS team through your Circle coordinator.');
  if (isPartner(me) && !to.partnerContact) fail(403, 'This member has not opted in to partner contact.');
  if (isMember(me) && to.orgType === 'partner' && !to.partnerContact) fail(403, 'This partner is not taking introductions.');
  const ent = entitlements(me);
  if (ent.kind === 'member' && introsThisQuarter(me) >= ent.introsPerQuarter) fail(403, `Your ${ent.tier} membership includes ${ent.introsPerQuarter} introductions a quarter, and they have been used.`);
  if (isPartner(me) && introsThisQuarter(me) >= 10) fail(403, 'Partners can request 10 introductions a quarter.');
  if (db().intros.some(n => n.fromId === me.id && n.toId === to.id && n.status === 'requested')) fail(400, 'You already have a pending request to this person.');
  const n = { id: id('n'), fromId: me.id, toId: to.id, reason: str(body.reason, 600, 10, 'Reason'), context: str(body.context || 'Directory', 60), status: 'requested', createdAt: now() };
  db().intros.push(n); audit(me, 'Requested introduction', `to ${to.name}`); save(); return n;
});
route('PATCH', '/api/intros/:id', ({ me, params, body }) => {
  const n = db().intros.find(x => x.id === params.id) || fail(404, 'Request not found.');
  if (n.toId !== me.id) fail(403, 'Only the recipient can respond.');
  if (!['accepted', 'declined'].includes(body.status)) fail(400, 'Choose accept or decline.');
  n.status = body.status; n.respondedAt = now();
  audit(me, `${body.status === 'accepted' ? 'Accepted' : 'Declined'} introduction`, `from ${person(n.fromId).name}`); save(); return n;
});

// Events & roundtables
route('POST', '/api/events/:id/attend', ({ me, params }) => {
  const e = db().events.find(x => x.id === params.id) || fail(404, 'Event not found.');
  e.attendees = e.attendees.includes(me.id) ? e.attendees.filter(a => a !== me.id) : [...e.attendees, me.id];
  audit(me, e.attendees.includes(me.id) ? 'Marked attending' : 'Unmarked attending', e.title); save(); return eventView(e, me);
});
route('GET', '/api/events/:id/matches', ({ me, params }) => {
  const e = db().events.find(x => x.id === params.id) || fail(404, 'Event not found.');
  const myInst = isMember(me) ? inst(me.orgId) : null;
  const matches = e.attendees.filter(a => a !== me.id).map(person).filter(p => p && p.orgType !== 'qs').filter(p => !isPartner(me) || p.partnerContact || p.orgType === 'partner').map(p => {
    const reasons = []; let score = 0;
    const shared = p.interests.filter(i => me.interests.includes(i));
    if (shared.length) { score += shared.length * 2; reasons.push(`Shared focus: ${shared.map(d => DOMAINS.find(x => x.id === d).short).join(', ')}`); }
    const regions = p.regions.filter(r => me.regions.includes(r));
    if (regions.length) { score += regions.length; reasons.push(`Both active in ${regions.join(', ')}`); }
    const theirInst = p.orgType === 'institution' ? inst(p.orgId) : null;
    if (myInst && theirInst) {
      const open = theirInst.openTo.filter(o => myInst.openTo.includes(o));
      if (open.length) { score += 2; reasons.push(`Both open to ${open[0].toLowerCase()}`); }
      if (theirInst.region !== myInst.region) { score += 0.5; reasons.push(`Cross-region view (${theirInst.region})`); }
    }
    if (p.orgType === 'partner') { if (!p.partnerContact) return null; score -= 1; reasons.push('Partner · labelled'); }
    return { person: pub(p), score, reasons };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 6);
  return { event: eventView(e, me), matches };
});
route('POST', '/api/roundtables/:id/rsvp', ({ me, params }) => {
  const r = db().roundtables.find(x => x.id === params.id) || fail(404, 'Roundtable not found.');
  const v = roundtableView(r, me);
  if (r.rsvps.includes(me.id)) r.rsvps = r.rsvps.filter(x => x !== me.id);
  else { if (!v.canRsvp) fail(403, v.whyNot); if (r.rsvps.length >= r.capacity) fail(409, 'This roundtable is full. Join the waiting list via the coordinator.'); r.rsvps.push(me.id); }
  audit(me, r.rsvps.includes(me.id) ? 'Reserved roundtable place' : 'Released roundtable place', r.title); save(); return roundtableView(r, me);
});

// Partner Hub
route('GET', '/api/challenges', ({ me }) => ({
  challenges: db().challenges.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(c => ({
    ...c, institution: inst(c.institutionId), author: pub(person(c.authorId)),
    responses: c.responses.filter(r => !isPartner(me) || r.partnerId === me.orgId || isStaff(me)).map(r => ({ ...r, partner: partner(r.partnerId) })),
    responseCount: c.responses.length, mine: isMember(me) && c.institutionId === me.orgId
  }))
}));
route('POST', '/api/challenges', ({ me, body }) => {
  if (!isMember(me)) fail(403, 'Member institutions post challenges; partners respond.');
  const c = { id: id('ch'), institutionId: me.orgId, authorId: me.id, domain: domainsOf([body.domain])[0] || fail(400, 'Choose a domain.'), status: 'Open for proposals', createdAt: now(), title: str(body.title, 160, 8, 'Title'), description: str(body.description, 2000, 30, 'Description'), responses: [] };
  db().challenges.push(c); audit(me, 'Posted challenge', c.title); save(); return c;
});
route('POST', '/api/challenges/:id/responses', ({ me, params, body }) => {
  const c = db().challenges.find(x => x.id === params.id) || fail(404, 'Challenge not found.');
  if (!isPartner(me)) fail(403, 'Only partners respond to challenges.');
  if (c.responses.some(r => r.partnerId === me.orgId)) fail(400, 'Your organisation has already responded. The institution will be in touch if shortlisted.');
  const r = { id: id('cr'), partnerId: me.orgId, personId: me.id, summary: str(body.summary, 1200, 20, 'Proposal'), createdAt: now(), status: 'Submitted' };
  c.responses.push(r); audit(me, 'Responded to challenge', c.title); save(); return r;
});
route('PATCH', '/api/challenges/:id/responses/:rid', ({ me, params, body }) => {
  const c = db().challenges.find(x => x.id === params.id) || fail(404, 'Challenge not found.');
  if (!(isMember(me) && c.institutionId === me.orgId) && !isStaff(me)) fail(403, 'Only the institution that posted this challenge can update proposals.');
  const r = c.responses.find(x => x.id === params.rid) || fail(404, 'Proposal not found.');
  if (!['Shortlisted', 'Selected', 'Declined'].includes(body.status)) fail(400, 'Unknown status.');
  r.status = body.status; if (body.status === 'Selected') c.status = 'In pilot';
  audit(me, `Marked proposal ${body.status.toLowerCase()}`, c.title); save(); return r;
});
route('GET', '/api/partner-insights', ({ me }) => {
  const ent = entitlements(me);
  if (!ent.insights) fail(403, isPartner(me) ? 'Aggregated priorities insight is included from the Domain Partner package.' : 'For Domain and Principal partners.');
  const members = db().people.filter(p => p.orgType === 'institution');
  const MIN = 5;
  const interest = DOMAINS.map(d => ({ domain: d.id, name: d.name, count: members.filter(p => p.interests.includes(d.id)).length }));
  const persona = Object.entries(members.reduce((a, p) => ((a[p.persona] = (a[p.persona] || 0) + 1), a), {})).map(([k, v]) => ({ persona: k, count: v })).sort((a, b) => b.count - a.count);
  const challengeByDomain = DOMAINS.map(d => ({ domain: d.id, name: d.name, open: db().challenges.filter(c => c.domain === d.id && c.status === 'Open for proposals').length }));
  const regions = Object.entries(db().institutions.reduce((a, i) => ((a[i.region] = (a[i.region] || 0) + 1), a), {})).map(([k, v]) => ({ region: k, count: v }));
  return { minGroup: MIN, members: members.length, optedIn: members.filter(p => p.partnerContact).length, interest, persona: persona.map(p => (p.count < MIN ? { ...p, count: null } : p)), challengeByDomain, regions: regions.map(r => (r.count < 2 ? { ...r, count: null } : r)) };
});

// Profiles
route('PATCH', '/api/me', ({ me, body }) => {
  if (body.title !== undefined) me.title = str(body.title, 120, 2, 'Job title');
  if (body.persona !== undefined && !isPartner(me) && !isStaff(me)) me.persona = str(body.persona, 40);
  if (body.interests !== undefined) me.interests = domainsOf(body.interests);
  if (body.regions !== undefined) me.regions = (Array.isArray(body.regions) ? body.regions : []).map(r => str(r, 40)).slice(0, 8);
  if (body.partnerContact !== undefined) me.partnerContact = !!body.partnerContact;
  if (body.newsletter !== undefined) me.newsletter = ['weekly', 'monthly', 'off'].includes(body.newsletter) ? body.newsletter : me.newsletter;
  if (body.bio !== undefined) me.bio = str(body.bio, 600);
  audit(me, 'Updated profile'); save(); return pub(me);
});
route('PATCH', '/api/institutions/:id', ({ me, params, body }) => {
  const i = inst(params.id) || fail(404, 'Institution not found.');
  if (!isStaff(me) && !(isMember(me) && me.orgId === i.id)) fail(403, 'Only people at this institution can edit its page.');
  if (!isStaff(me) && me.role !== 'admin' && body.tier === undefined) fail(403, 'Only your institution’s QS One admin can edit this page.');
  if (body.overview !== undefined) i.overview = str(body.overview, 1200);
  if (body.challenges !== undefined) i.challenges = str(body.challenges, 800);
  if (body.priorities !== undefined) i.priorities = domainsOf(body.priorities);
  if (body.openTo !== undefined) i.openTo = (Array.isArray(body.openTo) ? body.openTo : []).map(x => str(x, 60)).filter(Boolean).slice(0, 8);
  if (body.visible !== undefined) i.visible = !!body.visible;
  if (body.tier !== undefined) { if (!TIERS[body.tier]) fail(400, 'Unknown tier.'); i.tier = body.tier; audit(me, 'Switched demo tier', `${i.name} → ${body.tier}`); }
  audit(me, 'Edited institution page', i.name); save(); return i;
});

// QS team
route('GET', '/api/admin/overview', ({ me }) => {
  if (!isStaff(me)) fail(403, 'For the QS One team.');
  const d = db();
  const members = d.institutions;
  return {
    counts: { institutions: members.length, people: d.people.filter(p => p.orgType === 'institution').length, partners: d.partners.length, posts: d.posts.length, intros: d.intros.length, challenges: d.challenges.length },
    byTier: Object.keys(TIERS).map(t => ({ tier: t, count: members.filter(i => i.tier === t).length, arr: members.filter(i => i.tier === t).length * TIERS[t].price })),
    byPartnerTier: Object.keys(PARTNER_TIERS).map(t => ({ tier: t, count: d.partners.filter(p => p.tier === t).length, arr: d.partners.filter(p => p.tier === t).length * PARTNER_TIERS[t].price })),
    pulse: d.pulses.map(p => ({ id: p.id, title: p.title, responses: d.responses.filter(r => r.pulseId === p.id).length, real: d.responses.filter(r => r.pulseId === p.id && !r.demo).length })),
    circles: d.circles.map(c => ({ id: c.id, title: c.title, members: c.members.length })),
    audit: d.audit.slice(0, 60)
  };
});
route('POST', '/api/admin/reset', ({ me }) => { if (!isStaff(me)) fail(403, 'For the QS One team.'); reset(); return { ok: true }; });

// ---------- server ----------
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 200_000) { reject(new HttpError(413, 'Request too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (!chunks.length) return resolve({}); try { const o = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(o && typeof o === 'object' ? o : {}); } catch { reject(new HttpError(400, 'Invalid JSON.')); } });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  const b = Buffer.from(JSON.stringify(data));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': b.length });
  res.end(b);
}

function serveStatic(req, res, pathname) {
  let file = path.join(PUBLIC, decodeURIComponent(pathname));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(500, { 'Content-Type': 'text/plain' }); return res.end('The app has not been built. Run: npm run build'); }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  try {
    const r = routes.find(r => r.method === req.method && r.re.test(url.pathname));
    if (!r) fail(404, 'Not found.');
    const params = url.pathname.match(r.re).groups || {};
    const me = person(String(req.headers['x-demo-user'] || '')) || person(db().personas[0]);
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
    const out = await r.handler({ me, params, body, query: Object.fromEntries(url.searchParams) });
    send(res, 200, out);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e instanceof HttpError ? e.message : 'Something went wrong on the server. Check the console.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  QS One proof of concept running on http://localhost:${PORT}\n  Demo data only. No sign-in, no emails sent.\n`);
  startScheduler();
});
