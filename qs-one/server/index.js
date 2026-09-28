// QS One v2 proof of concept: API + static file server. Node 18+ standard library only.
// Demo identity comes from the "x-demo-user" header set by the persona switcher.
// This is NOT authentication. Do not enter real personal or confidential data.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { load, reset, save, id } from './store.js';
import * as store from './store.js';
import { DOMAINS, TIERS, ACCESS_RANK, ACCESS_LABEL } from './seed.js';
import { startScheduler, refreshAll, getSources, getListing, getStatus } from './sources.js';

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.resolve('public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };
const DAY = 864e5;
const ACTIVE_DAYS = 60;

load();
const db = () => store.db;

// ---------- helpers ----------
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
const str = (v, max = 500, min = 0, label = 'Text') => { const s = String(v ?? '').trim(); if (s.length < min) fail(400, `${label} needs at least ${min} characters.`); return s.slice(0, max); };
const domainsOf = v => (Array.isArray(v) ? v : []).filter(d => DOMAINS.some(x => x.id === d)).slice(0, 4);
const now = () => new Date().toISOString();
const person = pid => db().people.find(p => p.id === pid);
const inst = iid => db().institutions.find(i => i.id === iid);
const partner = pid => db().partners.find(p => p.id === pid);
const orgOf = p => (p.orgType === 'institution' ? inst(p.orgId) : p.orgType === 'partner' ? partner(p.orgId) : { id: 'qs', name: 'QS Quacquarelli Symonds' });
const isStaff = p => p.role === 'staff';
const isPartner = p => p.orgType === 'partner';
const isMember = p => p.orgType === 'institution';
const tierName = p => (isMember(p) ? inst(p.orgId).tier : null);
const T = p => TIERS[tierName(p)] || TIERS.Free;
const accessRank = p => (isStaff(p) ? 3 : isMember(p) ? T(p).rank : 0);
const audit = (who, action, detail = '') => { db().audit.unshift({ at: now(), who: who.id, name: who.name, action, detail }); db().audit.length = Math.min(db().audit.length, 400); };
const needTier = (me, rank, what) => { if (!isStaff(me) && accessRank(me) < rank) fail(403, `${what} is included from ${ACCESS_LABEL[Object.keys(ACCESS_RANK).find(k => ACCESS_RANK[k] === rank)]}.`); };

function pub(p) {
  const o = orgOf(p);
  return { id: p.id, name: p.name, title: p.title, persona: p.persona, orgType: p.orgType, orgId: p.orgId, orgName: o?.name, country: o?.country, region: o?.region, tier: o?.tier, interests: p.interests, regions: p.regions, partnerContact: p.partnerContact, bio: p.bio, role: p.role, newsletter: p.newsletter, status: p.status, lastLogin: p.lastLogin };
}

function entitlements(me) {
  if (isStaff(me)) return { ...TIERS.Council, kind: 'staff', label: 'QS team', tier: 'Council', rank: 3 };
  if (isPartner(me)) return { ...TIERS.Free, kind: 'partner', label: 'Commercial partner', tier: null, rank: 0, introsPerQuarter: 10 };
  const t = tierName(me);
  return { ...TIERS[t], kind: 'member', label: t === 'Free' ? 'Network (free)' : t, tier: t };
}

// ---------- activation & onboarding ----------
function activation(i) {
  const people = db().people.filter(p => p.orgType === 'institution' && p.orgId === i.id);
  const activePeople = people.filter(p => p.status === 'active' && p.lastLogin && Date.now() - Date.parse(p.lastLogin) < ACTIVE_DAYS * DAY);
  const answered = db().responses.some(r => r.institutionId === i.id);
  return { members: people.filter(p => p.status === 'active').length, invited: people.filter(p => p.status === 'invited').length, activeMembers: activePeople.length, answered, active: activePeople.length >= 2 && answered };
}
function onboarding(me) {
  if (!isMember(me)) return null;
  const i = inst(me.orgId); const a = activation(i);
  const inCommunity = db().communities.some(c => c.kind !== 'Executive Council' && c.members.some(m => person(m)?.orgId === i.id));
  const openReg = db().openSessions.some(s => s.registrations.some(m => person(m)?.orgId === i.id));
  const steps = [
    { id: 'lead', label: 'Name a QS One lead for your institution', done: !!i.leadId },
    { id: 'verify', label: 'Institution verified by QS', done: i.verified },
    { id: 'profile', label: 'Complete your institution profile', done: !!(i.overview && i.challenges && i.priorities.length) },
    { id: 'team', label: 'Two or more colleagues active on QS One', done: a.activeMembers >= 2, detail: `${a.activeMembers} active · ${a.invited} invited` },
    { id: 'pulse', label: 'Answer your first Pulse', done: a.answered },
    { id: 'community', label: i.tier === 'Free' ? 'Register for an open community session' : 'Join a community', done: inCommunity || openReg }
  ];
  return { steps, done: steps.filter(s => s.done).length, total: steps.length, activation: a };
}

// ---------- views ----------
function communityView(c, me) {
  const ent = entitlements(me);
  const isIn = c.members.includes(me.id);
  let canJoin = false, why = '';
  const myDomainCommunities = db().communities.filter(x => x.kind === 'Domain community' && x.members.includes(me.id));
  if (isStaff(me)) canJoin = true;
  else if (!isMember(me)) why = 'Communities are for member institutions. Partners can host labelled open sessions.';
  else if (c.kind === 'Executive Council') { if (ent.execCouncil) canJoin = true; else why = 'Executive Council seats are included with Council membership.'; }
  else if (c.kind === 'Regional chapter') { if (ent.chapters) canJoin = true; else why = 'Regional chapters are included from Member. Free members can join open quarterly sessions.'; }
  else if (ent.domainCommunities === 0) why = 'Joining a community is included from Member. Free members can join open quarterly sessions.';
  else if (ent.domainCommunities === 1 && !isIn && myDomainCommunities.length >= 1) why = `Your Member plan includes one domain community (you are in ${myDomainCommunities[0].title}). Member Plus includes all four.`;
  else canJoin = true;
  const next = (c.sessions || []).filter(s => Date.parse(s.at) > Date.now()).sort((a, b) => a.at.localeCompare(b.at))[0] || null;
  const institutions = new Set(c.members.map(m => person(m)?.orgId)).size;
  return { ...c, members: undefined, memberIds: c.members, memberCount: c.members.length, institutionCount: institutions, isMember: isIn, canJoin, whyNot: why, next };
}
function eventView(e, me) { return { ...e, attending: e.attendees.includes(me.id), attendeeCount: e.attendees.length, attendees: undefined, past: Date.parse(e.start) + 3 * DAY < Date.now() }; }
const locked = (item, me) => ACCESS_RANK[item.access] > accessRank(me);

// ---------- intelligence ----------
function intelFor(me) {
  const sources = getSources(); const byId = Object.fromEntries(sources.map(s => [s.id, s]));
  const items = db().intel.map(b => {
    const l = locked(b, me);
    const base = { ...b, itemType: 'intel', locked: l, accessLabel: ACCESS_LABEL[b.access], sources: (b.sourceIds || []).map(i => byId[i]).filter(Boolean).map(s => ({ id: s.id, title: s.title, url: s.url, status: s.status, asOf: s.asOf })) };
    if (l) { delete base.body; delete base.soWhat; delete base.action; }
    return base;
  });
  for (const s of sources.filter(s => s.domain !== 'events')) items.push({ id: `src-${s.id}`, itemType: 'source', label: 'QS Evidence', kind: s.kind, title: s.title, summary: s.summary, domains: [s.domain], published: s.asOf, url: s.url, status: s.status, asOf: s.asOf, excerpts: s.excerpts.slice(0, 2), access: 'free', locked: false, priority: s.priority });
  for (const l of getListing()) items.push({ id: `lst-${l.url}`, itemType: 'listing', label: 'QS Evidence', kind: 'QS Insights article', title: l.title, summary: 'New on QS Insights.', domains: [l.domain], published: l.fetchedAt, url: l.url, status: 'live', asOf: l.fetchedAt, access: 'free', locked: false });
  return items.map(it => {
    const reasons = []; let score = 0;
    const overlap = it.domains.filter(d => me.interests.includes(d));
    if (overlap.length) { score += 3 + overlap.length - 1; reasons.push(`Your interest: ${overlap.map(d => DOMAINS.find(x => x.id === d).short).join(', ')}`); }
    if (it.kind === 'Signal') { score += 1; }
    const age = (Date.now() - Date.parse(it.published)) / DAY;
    if (age < 7) { score += 2; reasons.push('This week'); }
    if (it.itemType === 'intel') score += 1.5;
    if (it.itemType === 'source') score += (5 - (it.priority || 4)) * 0.4;
    if (it.locked) score -= 1.5;
    if (!reasons.length) reasons.push('Across your domains');
    return { ...it, score, reasons };
  }).sort((a, b) => b.score - a.score || String(b.published).localeCompare(String(a.published)));
}

// ---------- Pulse ----------
const median = xs => { const s = [...xs].sort((a, b) => a - b); const n = s.length; if (!n) return null; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); if (!s.length) return null; const pos = (s.length - 1) * q; const lo = Math.floor(pos), hi = Math.ceil(pos); return +(s[lo] + (s[hi] - s[lo]) * (pos - lo)).toFixed(1); };
const r1 = x => (x == null ? null : Math.round(x * 10) / 10);

function cohortFilter(p, me, q) {
  const ent = entitlements(me);
  const kind = q.cohort || 'all';
  if (kind === 'all') return { label: 'All respondents', fn: () => true, kind };
  if (kind === 'region' || kind === 'type') {
    if (!ent.cohortCuts && !isStaff(me)) fail(403, 'Results by region and institution type are included from Member.');
    const v = String(q.value || '');
    return { label: kind === 'region' ? `Region: ${v}` : `Type: ${v}`, fn: r => (kind === 'region' ? inst(r.institutionId)?.region : inst(r.institutionId)?.type) === v, kind, value: v };
  }
  if (kind === 'bespoke') {
    if (!ent.bespokeCohort && !isStaff(me)) fail(403, 'A bespoke benchmark cohort is included with Council.');
    const ids = String(q.peers || '').split(',').filter(Boolean);
    if (ids.length < p.minCohort) fail(400, `Choose at least ${p.minCohort} peer institutions for a bespoke cohort.`);
    return { label: `Bespoke cohort (${ids.length} institutions)`, fn: r => ids.includes(r.institutionId), kind, ids };
  }
  return { label: 'All respondents', fn: () => true, kind: 'all' };
}

function pulseResults(p, me, q) {
  const f = cohortFilter(p, me, q);
  const myInst = isMember(me) ? me.orgId : null;
  const all = db().responses.filter(r => r.pulseId === p.id);
  const rs = all.filter(r => f.fn(r) && r.institutionId !== myInst);
  const mine = all.find(r => r.institutionId === myInst);
  const n = rs.length;
  const out = { n, cohort: f, suppressed: n < p.minCohort, demoShare: rs.filter(r => r.demo).length, questions: [], cards: null };
  if (out.suppressed) return out;
  const prev = db().pulses.find(x => x.series === p.series && x.id !== p.id && Date.parse(x.closesAt) < Date.parse(p.closesAt));
  const prevAll = prev ? db().responses.filter(r => r.pulseId === prev.id) : [];
  const prevMine = prevAll.find(r => r.institutionId === myInst);
  for (const qq of p.questions) {
    if (qq.type === 'numberByMarket') {
      const rows = p.markets.map(m => {
        const vals = rs.map(r => r.answers[qq.id]?.[m]).filter(v => typeof v === 'number');
        const prevVals = prevAll.filter(r => f.fn(r) && r.institutionId !== myInst).map(r => r.answers[qq.id]?.[m]).filter(v => typeof v === 'number');
        return { market: m, median: r1(median(vals)), p25: quantile(vals, 0.25), p75: quantile(vals, 0.75), n: vals.length, mine: mine?.answers[qq.id]?.[m] ?? null, prevMine: prevMine?.answers[qq.id]?.[m] ?? null, prevMedian: r1(median(prevVals)) };
      });
      out.questions.push({ ...qq, rows });
      if (mine) {
        const gap = rows.map(r => ({ market: r.market, v: r.mine - r.median }));
        const chg = rows.filter(r => r.prevMine != null).map(r => ({ market: r.market, v: r.mine - r.prevMine }));
        const pick = (arr, dir) => arr.length ? arr.reduce((a, b) => (dir * b.v > dir * a.v ? b : a)) : null;
        out.cards = { strongest: pick(gap, 1), weakest: pick(gap, -1), improved: pick(chg.filter(x => x.v > 0), 1), declined: pick(chg.filter(x => x.v < 0), -1), prevWave: chg.length ? prev?.wave || null : null };
      } else {
        const moves = rows.filter(r => r.prevMedian != null).map(r => ({ market: r.market, v: r.median - r.prevMedian }));
        const pick = (arr, dir) => arr.length ? arr.reduce((a, b) => (dir * b.v > dir * a.v ? b : a)) : null;
        out.marketCards = { strongest: pick(rows.map(r => ({ market: r.market, v: r.median })), 1), weakest: pick(rows.map(r => ({ market: r.market, v: r.median })), -1), improved: pick(moves.filter(x => x.v > 0), 1), declined: pick(moves.filter(x => x.v < 0), -1), prevWave: moves.length ? prev?.wave || null : null };
      }
    } else if (qq.type === 'number') {
      const vals = rs.map(r => r.answers[qq.id]).filter(v => typeof v === 'number');
      out.questions.push({ ...qq, median: r1(median(vals)), p25: quantile(vals, 0.25), p75: quantile(vals, 0.75), mine: mine?.answers[qq.id] ?? null });
    } else {
      const counts = Object.fromEntries(qq.options.map(o => [o, 0]));
      for (const r of rs) if (r.answers[qq.id] in counts) counts[r.answers[qq.id]]++;
      out.questions.push({ ...qq, options: qq.options.map(o => ({ option: o, count: counts[o], pct: Math.round((100 * counts[o]) / n) })), mine: mine?.answers[qq.id] ?? null });
    }
  }
  return out;
}

function pulseSummary(p, me) {
  const myInst = isMember(me) ? me.orgId : null;
  const rs = db().responses.filter(r => r.pulseId === p.id);
  const total = db().institutions.length;
  return { id: p.id, title: p.title, series: p.series, wave: p.wave, status: p.status, closesAt: p.closesAt, domain: p.domain, roles: p.roles, responses: rs.length, contributionRate: Math.round((100 * rs.length) / total), contributed: !!(myInst && rs.some(r => r.institutionId === myInst)), forMe: p.roles.includes(me.persona) };
}

// ---------- routes ----------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler });

route('GET', '/api/health', () => ({ ok: true, app: 'QS One', version: 2, time: now() }));

route('GET', '/api/bootstrap', ({ me }) => {
  const d = db();
  const ent = entitlements(me);
  const visibleInst = d.institutions.filter(i => i.visible || i.id === me.orgId || isStaff(me));
  let people = d.people.filter(p => p.orgType !== 'qs' && p.status === 'active');
  if (isPartner(me)) people = people.filter(p => p.partnerContact || p.orgType === 'partner');
  people = people.filter(p => p.orgType !== 'institution' || visibleInst.some(i => i.id === p.orgId));
  if (isMember(me)) people = [...people, ...d.people.filter(p => p.orgId === me.orgId && p.status === 'invited')];
  me.lastLogin = now();
  return {
    me: pub(me), org: orgOf(me), entitlements: ent, onboarding: onboarding(me),
    personas: d.personas.map(pid => { const p = person(pid); return { id: p.id, name: p.name, title: p.title, orgName: orgOf(p).name, label: entitlements(p).label }; }),
    domains: DOMAINS, tiers: TIERS, accessLabels: ACCESS_LABEL,
    institutions: visibleInst.map(i => ({ ...i, memberCount: d.people.filter(p => p.orgId === i.id && p.status === 'active').length })),
    partners: d.partners, people: people.map(pub),
    communities: d.communities.map(c => communityView(c, me)),
    openSessions: d.openSessions.map(s => ({ ...s, registered: s.registrations.includes(me.id), count: s.registrations.length, registrations: undefined })),
    events: d.events.map(e => eventView(e, me)),
    intros: d.intros.filter(n => n.fromId === me.id || n.toId === me.id),
    introsUsed: d.intros.filter(n => n.fromId === me.id && Date.now() - Date.parse(n.createdAt) < 90 * DAY).length,
    pulses: d.pulses.map(p => pulseSummary(p, me)),
    webinarCount: d.webinars.length,
    sourceStatus: getStatus()
  };
});

// Intelligence
route('GET', '/api/intel', ({ me }) => ({ items: intelFor(me) }));
route('GET', '/api/intel/:id', ({ me, params }) => {
  const b = intelFor(me).find(i => i.id === params.id && i.itemType === 'intel') || fail(404, 'Briefing not found.');
  if (b.locked) fail(403, `This ${b.kind.toLowerCase()} is included from ${b.accessLabel}.`);
  return b;
});
route('GET', '/api/library', ({ me }) => ({ items: db().library.map(l => ({ ...l, locked: locked(l, me), accessLabel: ACCESS_LABEL[l.access] })) }));
route('GET', '/api/webinars', ({ me }) => ({ items: db().webinars.map(w => ({ ...w, locked: locked(w, me), accessLabel: ACCESS_LABEL[w.access], registered: w.registrations.includes(me.id), count: w.registrations.length, registrations: undefined, past: Date.parse(w.at) < Date.now() })) }));
route('POST', '/api/webinars/:id/register', ({ me, params }) => {
  const w = db().webinars.find(x => x.id === params.id) || fail(404, 'Webinar not found.');
  if (locked(w, me)) fail(403, `Closed-door webinars are included from ${ACCESS_LABEL[w.access]}.`);
  w.registrations = w.registrations.includes(me.id) ? w.registrations.filter(x => x !== me.id) : [...w.registrations, me.id];
  audit(me, w.registrations.includes(me.id) ? 'Registered for webinar' : 'Cancelled webinar registration', w.title); save();
  return { registered: w.registrations.includes(me.id) };
});
route('GET', '/api/sources', () => ({ sources: getSources(), listing: getListing(), status: getStatus() }));
route('POST', '/api/sources/refresh', ({ me }) => { const r = refreshAll({ reason: `manual (${me.name})` }); audit(me, 'Refreshed QS sources'); save(); return r; });

// Communities
route('GET', '/api/communities/:id', ({ me, params }) => {
  const c = db().communities.find(x => x.id === params.id) || fail(404, 'Community not found.');
  const v = communityView(c, me);
  const canRead = v.isMember || isStaff(me);
  return { ...v, members: c.members.map(m => pub(person(m))), posts: canRead ? db().posts.filter(p => p.communityId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(p => ({ ...p, author: pub(person(p.authorId)), replies: p.replies.map(r => ({ ...r, author: pub(person(r.authorId)) })) })) : null };
});
route('POST', '/api/communities/:id/join', ({ me, params }) => {
  const c = db().communities.find(x => x.id === params.id) || fail(404, 'Community not found.');
  const v = communityView(c, me); if (!v.canJoin) fail(403, v.whyNot);
  if (!c.members.includes(me.id)) c.members.push(me.id);
  audit(me, 'Joined community', c.title); save(); return communityView(c, me);
});
route('DELETE', '/api/communities/:id/join', ({ me, params }) => {
  const c = db().communities.find(x => x.id === params.id) || fail(404, 'Community not found.');
  c.members = c.members.filter(m => m !== me.id); audit(me, 'Left community', c.title); save(); return communityView(c, me);
});
route('POST', '/api/communities/:id/posts', ({ me, params, body }) => {
  const c = db().communities.find(x => x.id === params.id) || fail(404, 'Community not found.');
  if (!c.members.includes(me.id) && !isStaff(me)) fail(403, 'Join this community to post.');
  const type = ['Question', 'Practice note', 'Use case'].includes(body.type) ? body.type : 'Question';
  const p = { id: id('x'), communityId: c.id, type, authorId: me.id, title: str(body.title, 160, 8, 'Title'), body: str(body.body, 4000, 20, 'Your post'), createdAt: now(), replies: [], useful: [], status: type === 'Use case' ? 'Submitted for facilitator review' : null };
  db().posts.push(p); audit(me, `Posted ${type.toLowerCase()} in community`, p.title); save(); return p;
});
route('POST', '/api/posts/:id/replies', ({ me, params, body }) => {
  const p = db().posts.find(x => x.id === params.id) || fail(404, 'Post not found.');
  const c = db().communities.find(x => x.id === p.communityId);
  if (!c.members.includes(me.id) && !isStaff(me)) fail(403, 'Join this community to reply.');
  const r = { id: id('y'), authorId: me.id, body: str(body.body, 2000, 2, 'Reply'), createdAt: now() };
  p.replies.push(r); audit(me, 'Replied in community', p.title); save(); return r;
});
route('POST', '/api/posts/:id/useful', ({ me, params }) => {
  const p = db().posts.find(x => x.id === params.id) || fail(404, 'Post not found.');
  p.useful = p.useful.includes(me.id) ? p.useful.filter(u => u !== me.id) : [...p.useful, me.id]; save(); return { useful: p.useful.length };
});
route('POST', '/api/open-sessions/:id/register', ({ me, params }) => {
  const s = db().openSessions.find(x => x.id === params.id) || fail(404, 'Session not found.');
  if (isPartner(me)) fail(403, 'Open sessions are for institutions.');
  s.registrations = s.registrations.includes(me.id) ? s.registrations.filter(x => x !== me.id) : [...s.registrations, me.id];
  audit(me, s.registrations.includes(me.id) ? 'Registered for open session' : 'Cancelled open session', s.title); save(); return { registered: s.registrations.includes(me.id) };
});

// Pulse
route('GET', '/api/pulses/:id', ({ me, params, query }) => {
  const p = db().pulses.find(x => x.id === params.id) || fail(404, 'Pulse not found.');
  const s = pulseSummary(p, me);
  const myInst = isMember(me) ? me.orgId : null;
  const mine = myInst && db().responses.find(r => r.pulseId === p.id && r.institutionId === myInst);
  const regions = [...new Set(db().institutions.map(i => i.region))].sort();
  const types = [...new Set(db().institutions.map(i => i.type))].sort();
  const peers = db().institutions.filter(i => i.id !== myInst && db().responses.some(r => r.pulseId === p.id && r.institutionId === i.id)).map(i => ({ id: i.id, name: i.name, region: i.region }));
  const out = { ...p, ...s, myAnswers: mine?.answers || null, regions, types, peers };
  if (isPartner(me)) out.locked = 'Pulse results are only for contributing institutions. Commercial partners can buy aggregated insight on leader priorities.';
  else if (!mine && !isStaff(me)) out.locked = p.status === 'open' ? 'Answer this Pulse to see how peers compare. Only contributors see results.' : 'This Pulse has closed. Results are only for institutions that contributed.';
  else out.results = pulseResults(p, me, query);
  return out;
});
route('POST', '/api/pulses/:id/responses', ({ me, params, body }) => {
  const p = db().pulses.find(x => x.id === params.id) || fail(404, 'Pulse not found.');
  if (!isMember(me)) fail(403, 'Only institutions contribute to Pulse.');
  if (p.status !== 'open') fail(400, 'This Pulse has closed.');
  const answers = {};
  for (const q of p.questions) {
    const a = body.answers?.[q.id];
    if (q.type === 'numberByMarket') {
      answers[q.id] = {};
      for (const m of p.markets) { const v = Number(a?.[m]); if (!Number.isFinite(v) || a?.[m] === '' || a?.[m] == null) fail(400, `Enter a number for ${m}.`); if (v < -100 || v > 300) fail(400, `${m}: enter a change between −100% and 300%.`); answers[q.id][m] = Math.round(v * 10) / 10; }
    } else if (q.type === 'number') {
      const v = Number(a); if (!Number.isFinite(v) || a === '' || a == null) fail(400, `Answer: “${q.text}”`); if (Math.abs(v) > 100) fail(400, 'Enter a value between −100 and 100.'); answers[q.id] = Math.round(v * 10) / 10;
    } else { if (!q.options.includes(a)) fail(400, `Answer: “${q.text}”`); answers[q.id] = a; }
  }
  const existing = db().responses.find(r => r.pulseId === p.id && r.institutionId === me.orgId);
  if (existing) Object.assign(existing, { answers, personId: me.id, createdAt: now(), demo: false });
  else db().responses.push({ id: id('pr'), pulseId: p.id, institutionId: me.orgId, personId: me.id, answers, demo: false, createdAt: now() });
  audit(me, existing ? 'Updated Pulse response' : 'Contributed to Pulse', p.title); save();
  return { ok: true };
});

// Connect
route('POST', '/api/intros', ({ me, body }) => {
  const to = person(body.toId) || fail(404, 'Person not found.');
  const ent = entitlements(me);
  if (to.id === me.id) fail(400, 'You cannot request an introduction to yourself.');
  if (isMember(me) && ent.introsPerQuarter === 0) fail(403, 'Free members have a verified profile and receive introductions. Requesting introductions is included from Member.');
  if (isPartner(me) && !to.partnerContact) fail(403, 'This member has not opted in to partner contact.');
  const used = db().intros.filter(n => n.fromId === me.id && Date.now() - Date.parse(n.createdAt) < 90 * DAY).length;
  if (used >= ent.introsPerQuarter) fail(403, `Your plan includes ${ent.introsPerQuarter} introductions a quarter, and they have been used.`);
  if (db().intros.some(n => n.fromId === me.id && n.toId === to.id && n.status === 'requested')) fail(400, 'You already have a pending request to this person.');
  const n = { id: id('n'), fromId: me.id, toId: to.id, reason: str(body.reason, 600, 10, 'Reason'), context: str(body.context || 'Directory', 80), status: 'requested', createdAt: now(), concierge: !!ent.concierge, partner: isPartner(me) };
  db().intros.push(n); audit(me, ent.concierge ? 'Requested concierge introduction' : 'Requested introduction', `to ${to.name}`); save(); return n;
});
route('PATCH', '/api/intros/:id', ({ me, params, body }) => {
  const n = db().intros.find(x => x.id === params.id) || fail(404, 'Request not found.');
  if (n.toId !== me.id) fail(403, 'Only the recipient can respond.');
  if (!['accepted', 'declined'].includes(body.status)) fail(400, 'Choose accept or decline.');
  n.status = body.status; n.respondedAt = now(); audit(me, `${body.status === 'accepted' ? 'Accepted' : 'Declined'} introduction`, `from ${person(n.fromId).name}`); save(); return n;
});
route('POST', '/api/events/:id/attend', ({ me, params }) => {
  const e = db().events.find(x => x.id === params.id) || fail(404, 'Event not found.');
  e.attendees = e.attendees.includes(me.id) ? e.attendees.filter(a => a !== me.id) : [...e.attendees, me.id];
  audit(me, e.attendees.includes(me.id) ? 'Marked attending' : 'Unmarked attending', e.title); save(); return eventView(e, me);
});
route('GET', '/api/events/:id/matches', ({ me, params }) => {
  const e = db().events.find(x => x.id === params.id) || fail(404, 'Event not found.');
  const ent = entitlements(me);
  if (isMember(me)) {
    const i = inst(me.orgId);
    if (ent.summitMatching === 'none') fail(403, 'Summit matching is included from Member (one summit) and Member Plus (every summit).');
    if (ent.summitMatching === 'one') {
      if (i.matchSummit && i.matchSummit !== e.id) fail(403, `Your Member plan includes matching for one summit (${db().events.find(x => x.id === i.matchSummit).title}). Member Plus includes every summit.`);
      if (!i.matchSummit) { i.matchSummit = e.id; save(); }
    }
  }
  const myInst = isMember(me) ? inst(me.orgId) : null;
  const matches = e.attendees.filter(a => a !== me.id).map(person).filter(p => p && p.orgType !== 'qs' && (p.orgType !== 'institution' || p.orgId !== me.orgId)).filter(p => !isPartner(me) || p.partnerContact).map(p => {
    const reasons = []; let score = 0;
    const shared = p.interests.filter(i => me.interests.includes(i));
    if (shared.length) { score += 2 * shared.length; reasons.push(`Shared focus: ${shared.map(d => DOMAINS.find(x => x.id === d).short).join(', ')}`); }
    const regions = p.regions.filter(r => me.regions.includes(r));
    if (regions.length) { score += regions.length; reasons.push(`Both active in ${regions.join(', ')}`); }
    const theirs = p.orgType === 'institution' ? inst(p.orgId) : null;
    if (myInst && theirs) { const open = theirs.openTo.filter(o => myInst.openTo.includes(o)); if (open.length) { score += 2; reasons.push(`Both open to ${open[0].toLowerCase()}`); } }
    const sameCommunity = db().communities.find(c => c.members.includes(me.id) && c.members.includes(p.id));
    if (sameCommunity) { score += 1; reasons.push(`Both in ${sameCommunity.title}`); }
    if (p.orgType === 'partner') { score -= 2; reasons.push('Commercial partner · labelled'); }
    return { person: pub(p), score, reasons };
  }).sort((a, b) => b.score - a.score).slice(0, 6);
  return { event: eventView(e, me), matches, scope: ent.summitMatching };
});

// Partner board (Connect)
route('GET', '/api/board', ({ me }) => ({ items: db().board.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(c => ({ ...c, institution: inst(c.institutionId), author: pub(person(c.authorId)), responses: c.responses.filter(r => !isPartner(me) || r.partnerId === me.orgId).map(r => ({ ...r, partner: partner(r.partnerId) })), responseCount: c.responses.length, mine: isMember(me) && c.institutionId === me.orgId })) }));
route('POST', '/api/board', ({ me, body }) => {
  if (!isMember(me)) fail(403, 'Institutions post problems; partners respond.');
  const c = { id: id('b'), institutionId: me.orgId, authorId: me.id, domain: domainsOf([body.domain])[0] || fail(400, 'Choose a domain.'), status: 'Open', createdAt: now(), title: str(body.title, 160, 8, 'Title'), description: str(body.description, 2000, 30, 'Description'), responses: [] };
  db().board.push(c); audit(me, 'Posted to partner board', c.title); save(); return c;
});
route('POST', '/api/board/:id/responses', ({ me, params, body }) => {
  const c = db().board.find(x => x.id === params.id) || fail(404, 'Post not found.');
  if (!isPartner(me)) fail(403, 'Only commercial partners respond on the board.');
  if (c.responses.some(r => r.partnerId === me.orgId)) fail(400, 'Your organisation has already responded.');
  const r = { id: id('br'), partnerId: me.orgId, summary: str(body.summary, 1200, 20, 'Proposal'), createdAt: now(), status: 'Submitted' };
  c.responses.push(r); audit(me, 'Responded on partner board', c.title); save(); return r;
});
route('PATCH', '/api/board/:id/responses/:rid', ({ me, params, body }) => {
  const c = db().board.find(x => x.id === params.id) || fail(404, 'Post not found.');
  if (!(isMember(me) && c.institutionId === me.orgId) && !isStaff(me)) fail(403, 'Only the institution that posted can update proposals.');
  const r = c.responses.find(x => x.id === params.rid) || fail(404, 'Proposal not found.');
  if (!['Shortlisted', 'Selected', 'Declined'].includes(body.status)) fail(400, 'Unknown status.');
  r.status = body.status; if (body.status === 'Selected') c.status = 'In pilot';
  audit(me, `Marked proposal ${body.status.toLowerCase()}`, c.title); save(); return r;
});
route('GET', '/api/partner-insights', ({ me }) => {
  if (!isPartner(me) && !isStaff(me)) fail(403, 'For commercial partners.');
  const members = db().people.filter(p => p.orgType === 'institution' && p.status === 'active');
  const MIN = 5;
  const interest = DOMAINS.map(d => ({ name: d.name, count: members.filter(p => p.interests.includes(d.id)).length }));
  const risk = db().pulses.find(p => p.id === 'rp-sep');
  const rs = db().responses.filter(r => r.pulseId === risk.id);
  const riskQ = risk.questions.find(q => q.id === 'risk');
  const risks = riskQ.options.map(o => ({ option: o, count: rs.filter(r => r.answers.risk === o).length }));
  return { minGroup: MIN, members: members.length, optedIn: members.filter(p => p.partnerContact).length, interest, risks: rs.length >= MIN ? risks : null, n: rs.length };
});

// Profiles, institution, onboarding
route('PATCH', '/api/me', ({ me, body }) => {
  if (body.title !== undefined) me.title = str(body.title, 120, 2, 'Job title');
  if (body.persona !== undefined && isMember(me)) me.persona = str(body.persona, 40);
  if (body.interests !== undefined) me.interests = domainsOf(body.interests);
  if (body.regions !== undefined) me.regions = (Array.isArray(body.regions) ? body.regions : []).map(r => str(r, 40)).slice(0, 8);
  if (body.partnerContact !== undefined) me.partnerContact = !!body.partnerContact;
  if (body.newsletter !== undefined && ['weekly', 'monthly', 'off'].includes(body.newsletter)) me.newsletter = body.newsletter;
  if (body.bio !== undefined) me.bio = str(body.bio, 600);
  audit(me, 'Updated profile'); save(); return pub(me);
});
route('PATCH', '/api/institutions/:id', ({ me, params, body }) => {
  const i = inst(params.id) || fail(404, 'Institution not found.');
  if (!isStaff(me) && !(isMember(me) && me.orgId === i.id)) fail(403, 'Only people at this institution can edit it.');
  if (body.tier !== undefined) {
    if (!TIERS[body.tier]) fail(400, 'Unknown tier.');
    if (body.tier === 'Council' && i.tier !== 'Council' && db().institutions.filter(x => x.tier === 'Council').length >= TIERS.Council.cap) fail(409, `Council is capped at ${TIERS.Council.cap} institutions.`);
    const was = i.tier; i.tier = body.tier;
    if (TIERS[body.tier].rank > TIERS[was].rank && TIERS[body.tier].rank > 0) db().signings.push({ institutionId: i.id, tier: body.tier, at: now(), demo: true });
    if (TIERS[body.tier].domainCommunities === 1) { const mine = db().communities.filter(c => c.kind === 'Domain community' && c.members.some(m => person(m)?.orgId === i.id)); if (mine.length > 1) mine.slice(1).forEach(c => { c.members = c.members.filter(m => person(m)?.orgId !== i.id); }); }
    audit(me, 'Switched demo tier', `${i.name}: ${was} → ${body.tier}`); save(); return i;
  }
  if (!isStaff(me) && me.role !== 'lead') fail(403, 'Only your institution’s QS One lead can edit the institution profile.');
  if (body.overview !== undefined) i.overview = str(body.overview, 1200);
  if (body.challenges !== undefined) i.challenges = str(body.challenges, 800);
  if (body.priorities !== undefined) i.priorities = domainsOf(body.priorities);
  if (body.openTo !== undefined) i.openTo = (Array.isArray(body.openTo) ? body.openTo : []).map(x => str(x, 60)).filter(Boolean).slice(0, 8);
  if (body.visible !== undefined) i.visible = !!body.visible;
  audit(me, 'Edited institution profile', i.name); save(); return i;
});
route('POST', '/api/institution/invite', ({ me, body }) => {
  if (!isMember(me)) fail(403, 'Only institutions invite colleagues.');
  const p = { id: id('u'), orgType: 'institution', orgId: me.orgId, name: str(body.name, 80, 3, 'Name'), title: str(body.title, 120, 2, 'Job title'), persona: ['Executive', 'Strategy', 'Recruitment', 'Research', 'Partnerships', 'Careers', 'Digital', 'Finance'].includes(body.persona) ? body.persona : 'Recruitment', interests: domainsOf(body.interests || ['mobility']), regions: [], role: 'member', partnerContact: true, newsletter: 'weekly', bio: '', lastLogin: null, status: 'invited', invitedBy: me.id, invitedAt: now() };
  db().people.push(p); audit(me, 'Invited colleague', p.name); save(); return pub(p);
});
route('POST', '/api/people/:id/accept-invite', ({ me, params }) => {
  const p = person(params.id) || fail(404, 'Person not found.');
  if (p.orgId !== me.orgId && !isStaff(me)) fail(403, 'Not your colleague.');
  p.status = 'active'; p.lastLogin = now(); audit(me, 'Demo: colleague accepted invite', p.name); save(); return pub(p);
});

// QS team
route('GET', '/api/admin/overview', ({ me }) => {
  if (!isStaff(me)) fail(403, 'For the QS One team.');
  const d = db();
  return {
    activation: d.institutions.map(i => ({ id: i.id, name: i.name, tier: i.tier, ...activation(i) })),
    pulses: d.pulses.filter(p => p.status === 'open').map(p => pulseSummary(p, me)),
    communities: d.communities.map(c => ({ id: c.id, title: c.title, members: c.members.length, institutions: new Set(c.members.map(m => person(m)?.orgId)).size })),
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
function send(res, status, data) { const b = Buffer.from(JSON.stringify(data)); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': b.length }); res.end(b); }
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
    const r = routes.find(r => r.method === req.method && r.re.test(url.pathname)) || fail(404, 'Not found.');
    const params = url.pathname.match(r.re).groups || {};
    const me = person(String(req.headers['x-demo-user'] || '')) || person(db().personas[0]);
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
    send(res, 200, await r.handler({ me, params, body, query: Object.fromEntries(url.searchParams) }));
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e instanceof HttpError ? e.message : 'Something went wrong on the server. Check the console.' });
  }
});
server.listen(PORT, '0.0.0.0', () => { console.log(`\n  QS One proof of concept running on http://localhost:${PORT}\n  Demo data only. No sign-in, no emails sent.\n`); startScheduler(); });
