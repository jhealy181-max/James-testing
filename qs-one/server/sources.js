// QS source adapter: reads public qs.com pages, extracts title, description,
// headings and short excerpts, and caches them with a fetch date.
// Rules this adapter follows:
//   - public pages only, checked against robots.txt, one request at a time
//   - short excerpts plus a link back, never whole pages or licensed data
//   - if a fetch fails, the saved copy is used and labelled as saved, never as live
import fs from 'node:fs';
import path from 'node:path';
import { SOURCES, LISTINGS, SNAPSHOT_DATE } from './snapshot.js';

const DATA_DIR = process.env.QS_DATA_DIR || path.resolve('data');
const CACHE_FILE = path.join(DATA_DIR, 'sources-cache.json');
const UA = 'Mozilla/5.0 (compatible; QS-One-PoC/0.3; reads public QS pages for an internal proof of concept)';
const REFRESH_HOURS = Number(process.env.QS_REFRESH_HOURS || 12);
const LIVE = process.env.QS_LIVE_FETCH !== '0';

let cache = { lastRun: null, running: false, sources: {}, listing: [], log: [] };
let robots = null;

export function loadCache() {
  try { cache = { ...cache, ...JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')), running: false }; } catch { /* first run */ }
}

function saveCache() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = CACHE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ ...cache, running: false }, null, 1));
  fs.renameSync(tmp, CACHE_FILE);
}

// ---------- HTML helpers (no dependencies) ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', pound: '£', euro: '€' };
export function decode(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
const clean = s => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

export function parsePage(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(nav|footer|header)[\s\S]*?<\/\1>/gi, ' ');
  const meta = name => {
    const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i');
    const tag = html.match(re)?.[0];
    return tag ? clean(tag.match(/content=["']([^"']*)["']/i)?.[1]) : '';
  };
  const title = meta('og:title') || clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const description = meta('description') || meta('og:description');
  const headings = [...body.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].map(m => clean(m[1])).filter(t => t.length > 3 && t.length < 160);
  const paras = [...body.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(m => clean(m[2]))
    .filter(t => t.length > 70 && !/cookie|privacy policy|subscribe to|all rights reserved/i.test(t));
  const excerpts = [...new Set(paras)].slice(0, 5).map(t => (t.length > 420 ? t.slice(0, 417).replace(/\s\S*$/, '') + '…' : t));
  const published = meta('article:published_time') || meta('article:modified_time') || '';
  return { title, description, headings: [...new Set(headings)].slice(0, 8), excerpts, published };
}

export function parseListing(html, base) {
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let href = m[1];
    const text = clean(m[2]);
    if (!/\/insights\/[a-z0-9-]{12,}/i.test(href) || text.length < 25 || text.length > 200) continue;
    if (href.startsWith('/')) href = new URL(href, base).href;
    if (!href.startsWith('https://www.qs.com') || seen.has(href)) continue;
    seen.add(href);
    out.push({ url: href, title: text, domain: classify(text) });
  }
  return out.slice(0, 30);
}

const KEYWORDS = {
  mobility: /student|recruit|international|mobility|visa|flows?|agent|tne|transnational|enrol/i,
  institutions: /ranking|reputation|research|citation|strategy|leadership|benchmark/i,
  skills: /skill|employ|job|work|career|graduate|labour|labor/i,
  innovation: /\bai\b|artificial intelligence|digital|edtech|online|innovation|technology/i
};
export function classify(text) {
  for (const [d, re] of Object.entries(KEYWORDS)) if (re.test(text)) return d;
  return 'institutions';
}

// ---------- robots.txt ----------
async function loadRobots() {
  if (robots) return robots;
  robots = [];
  try {
    const r = await fetch('https://www.qs.com/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return robots;
    let applies = false;
    for (const raw of (await r.text()).split('\n')) {
      const line = raw.split('#')[0].trim();
      const [k, ...rest] = line.split(':');
      const v = rest.join(':').trim();
      if (/^user-agent$/i.test(k)) applies = v === '*';
      else if (applies && /^disallow$/i.test(k) && v) robots.push(v);
    }
  } catch { /* treat as no rules; fetch errors are handled per page */ }
  return robots;
}
const allowed = (url, rules) => { const p = new URL(url).pathname; return !rules.some(r => p.startsWith(r)); };

async function fetchHtml(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const type = r.headers.get('content-type') || '';
  if (!type.includes('html')) throw new Error(`Unexpected content type ${type}`);
  return (await r.text()).slice(0, 2_000_000);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function refreshAll({ reason = 'scheduled' } = {}) {
  if (cache.running) return { started: false, message: 'A refresh is already running.' };
  if (!LIVE) return { started: false, message: 'Live fetching is switched off (QS_LIVE_FETCH=0). Showing saved copies.' };
  cache.running = true;
  const started = new Date().toISOString();
  const log = [];
  (async () => {
    const rules = await loadRobots();
    for (const s of SOURCES) {
      const prev = cache.sources[s.id];
      try {
        if (!allowed(s.url, rules)) throw new Error('Blocked by robots.txt');
        const page = parsePage(await fetchHtml(s.url));
        if (!page.title && !page.excerpts.length) throw new Error('No readable content found');
        cache.sources[s.id] = { status: 'live', fetchedAt: new Date().toISOString(), ...page, error: null };
        log.push({ id: s.id, ok: true });
      } catch (e) {
        cache.sources[s.id] = { ...(prev || {}), status: prev?.status === 'live' ? 'stale' : 'snapshot', error: String(e.message || e), attemptedAt: new Date().toISOString() };
        log.push({ id: s.id, ok: false, error: String(e.message || e) });
      }
      await sleep(900);
    }
    for (const l of LISTINGS) {
      try {
        if (!allowed(l.url, rules)) throw new Error('Blocked by robots.txt');
        const items = parseListing(await fetchHtml(l.url), l.url);
        if (items.length) cache.listing = items.map(i => ({ ...i, fetchedAt: new Date().toISOString() }));
        log.push({ id: l.id, ok: true, count: items.length });
      } catch (e) {
        log.push({ id: l.id, ok: false, error: String(e.message || e) });
      }
    }
    cache.lastRun = { started, finished: new Date().toISOString(), reason, ok: log.filter(x => x.ok).length, failed: log.filter(x => !x.ok).length };
    cache.log = log;
    cache.running = false;
    saveCache();
    console.log(`[sources] refresh finished: ${cache.lastRun.ok} ok, ${cache.lastRun.failed} fell back to saved copies`);
  })().catch(e => { cache.running = false; console.error('[sources] refresh crashed', e); });
  return { started: true, message: 'Refreshing QS sources. This takes about 30 seconds.' };
}

export function startScheduler() {
  loadCache();
  const last = cache.lastRun?.finished ? Date.parse(cache.lastRun.finished) : 0;
  if (Date.now() - last > REFRESH_HOURS * 3600e3) setTimeout(() => refreshAll({ reason: 'startup' }), 2000);
  setInterval(() => refreshAll({ reason: 'scheduled' }), REFRESH_HOURS * 3600e3).unref();
}

// Merged view: live data where we have it, saved copy otherwise.
export function getSources() {
  return SOURCES.map(s => {
    const c = cache.sources[s.id];
    const live = c && (c.status === 'live' || c.status === 'stale') && c.fetchedAt;
    return {
      id: s.id, url: s.url, domain: s.domain, kind: s.kind, priority: s.priority,
      title: (live && c.title) || s.title,
      summary: (live && c.description) || s.summary,
      excerpts: live && c.excerpts?.length ? c.excerpts : s.excerpts,
      headings: live ? c.headings || [] : [],
      status: live ? c.status : 'snapshot',
      asOf: live ? c.fetchedAt : SNAPSHOT_DATE,
      lastError: c?.error || null,
      savedSummary: s.summary,
      savedExcerpts: s.excerpts
    };
  });
}

export function getListing() { return cache.listing || []; }
export function getStatus() {
  return { live: LIVE, running: cache.running, lastRun: cache.lastRun, log: cache.log, refreshHours: REFRESH_HOURS, snapshotDate: SNAPSHOT_DATE };
}
