// Content ingestion for QS One: QS Newsletters and QS Insights Magazine.
// Reads public pages only, checks robots.txt, one request at a time.
// Newsletters: Ghost RSS (full post HTML) with a sitemap + page fallback; each issue is split into articles.
// Magazine: edition Cover pages list the articles; each article page becomes one item.
// No external dependencies. Tagging is rule-based for now; Claude tagging is a later step (requirements REQ-TAG).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.QS_DATA_DIR || path.resolve('data');
const FILE = path.join(DATA_DIR, 'content.json');
const LIVE = process.env.QS_LIVE_FETCH !== '0';
const NEWSLETTER_BASE = (process.env.NEWSLETTER_BASE || 'https://newsletters.qs.com').replace(/\/$/, '');
const MAGAZINE_BASE = (process.env.MAGAZINE_BASE || 'https://magazine.qs.com').replace(/\/$/, '');
const NEWSLETTER_RSS_PAGES = Number(process.env.NEWSLETTER_RSS_PAGES || 3);
const MAGAZINE_EDITION_COUNT = Number(process.env.MAGAZINE_EDITION_COUNT || 3);
const MAGAZINE_EDITIONS = (process.env.MAGAZINE_EDITIONS || '').split(',').map(s => parseInt(s, 10)).filter(Boolean);
const INGEST_HOURS = Number(process.env.INGEST_HOURS || 6);
const DELAY_MS = Number(process.env.INGEST_DELAY_MS || 700);
const UA = 'Mozilla/5.0 (compatible; QS-One-PoC/0.4; reads public QS pages for an internal proof of concept)';
const VIDEO_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com', 'player.vimeo.com', 'fast.wistia.net', 'www.loom.com'];

let state = { lastRun: null, running: false, items: {}, editions: {}, overrides: {}, messages: [], sources: {}, etags: {} };

export function loadContent() {
  try { state = { ...state, ...JSON.parse(fs.readFileSync(FILE, 'utf8')), running: false }; } catch { /* first run */ }
}
function saveContent() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ ...state, running: false }));
  fs.renameSync(tmp, FILE);
}

// ---------- text and HTML helpers ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', pound: '£', euro: '€', eacute: 'é', middot: '·' };
const decode = s => String(s || '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const cdata = s => String(s || '').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
export const textOf = html => decode(String(html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|h\d|li|div|figcaption|blockquote)>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const words = t => (t ? t.split(/\s+/).length : 0);
const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const slugOf = u => { try { return new URL(u).pathname.replace(/\/+$/, '').split('/').pop() || 'item'; } catch { return 'item'; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function absUrl(u, base) {
  if (!u) return null;
  u = decode(u.trim());
  if (u.startsWith('//')) u = 'https:' + u;
  try { const x = new URL(u, base); return ['http:', 'https:'].includes(x.protocol) ? x.href : null; } catch { return null; }
}
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
    const k = m[1].toLowerCase(); if (k === tag.match(/^<\/?([a-zA-Z0-9]+)/)?.[1]?.toLowerCase()) continue;
    out[k] = m[2] ? m[2].replace(/^["']|["']$/g, '') : '';
  }
  return out;
}
const meta = (html, name) => {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i'))?.[0];
  return tag ? decode(attrs(tag).content || '').trim() : '';
};

const KEEP = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i', 'a', 'img', 'figure', 'figcaption', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe', 'video', 'source', 'sup', 'sub', 'span', 'div']);
// First-pass cleaning on the server. The browser sanitises again with DOMPurify before display.
export function cleanHtml(html, base) {
  let s = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|form|button|select|textarea|svg|canvas|object|embed|template|head)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(input|link|meta)\b[^>]*>/gi, '')
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (m, a) => { const src = absUrl(attrs(`<iframe ${a}>`).src || attrs(`<iframe ${a}>`)['data-src'], base); try { return src && VIDEO_HOSTS.includes(new URL(src).hostname) ? `<iframe${a}></iframe>` : ''; } catch { return ''; } });
  s = s.replace(/<\/?([a-zA-Z0-9]+)\b[^>]*>/g, (tag, name) => {
    name = name.toLowerCase();
    if (!KEEP.has(name)) return name === 'h1' ? (tag.startsWith('</') ? '</h2>' : '<h2>') : '';
    if (tag.startsWith('</')) return `</${name}>`;
    const a = attrs(tag); const keep = [];
    if (name === 'a') { const h = absUrl(a.href, base); if (h) keep.push(`href="${h}"`); }
    if (name === 'img') {
      const src = absUrl(a.src && !a.src.startsWith('data:') ? a.src : a['data-src'] || a['data-lazy-src'], base);
      if (!src) return '';
      keep.push(`src="${src}"`); if (a.alt) keep.push(`alt="${a.alt.replace(/"/g, '&quot;')}"`);
    }
    if (name === 'iframe') {
      const src = absUrl(a.src || a['data-src'], base);
      if (!src || !VIDEO_HOSTS.includes(new URL(src).hostname)) return '';
      keep.push(`src="${src}"`, 'allowfullscreen');
    }
    if (name === 'video' || name === 'source') { const src = absUrl(a.src, base); if (src) keep.push(`src="${src}"`); if (name === 'video') { keep.push('controls'); const p = absUrl(a.poster, base); if (p) keep.push(`poster="${p}"`); } }
    if (/^h[2-5]$/.test(name) && a.id) keep.push(`id="${a.id.replace(/[^a-zA-Z0-9_-]/g, '')}"`);
    if (name === 'td' || name === 'th') { if (a.colspan) keep.push(`colspan="${parseInt(a.colspan, 10) || 1}"`); }
    return `<${name}${keep.length ? ' ' + keep.join(' ') : ''}${name === 'img' || name === 'br' || name === 'hr' || name === 'source' ? ' /' : ''}>`;
  });
  // drop iframes whose opening tag was removed, empty wrappers and excess whitespace
  s = s.replace(/<\/iframe>/gi, m => m).replace(/<(div|span|p)>\s*<\/\1>/gi, '').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
function mediaOf(html) {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => attrs(m[0])).filter(a => a.src && !/logo|icon|sprite|avatar|pixel|spacer/i.test(a.src)).map(a => ({ src: decode(a.src), alt: decode(a.alt || '') }));
  const videos = [...html.matchAll(/<iframe\b[^>]*>/gi)].map(m => attrs(m[0]).src).filter(Boolean).map(src => ({ src: decode(src), kind: 'embed' }))
    .concat([...html.matchAll(/<video\b[^>]*>/gi)].map(m => attrs(m[0])).filter(a => a.src).map(a => ({ src: decode(a.src), kind: 'file', poster: a.poster ? decode(a.poster) : null })));
  return { images, videos };
}

// "Readability-lite": keep the run of content blocks between the first and last substantial paragraph.
function mainContent(html, base) {
  let s = html.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, '').replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, '');
  const art = s.match(/<article\b[\s\S]*<\/article>/i)?.[0] || s.match(/<main\b[\s\S]*<\/main>/i)?.[0];
  if (art && words(textOf(art)) > 120) s = art;
  const blocks = [...s.matchAll(/<(p|h[1-4]|blockquote|ul|ol|figure|table)\b[^>]*>[\s\S]*?<\/\1>|<img\b[^>]*>|<iframe\b[^>]*>[\s\S]*?<\/iframe>|<video\b[^>]*>[\s\S]*?<\/video>/gi)].map(m => m[0]);
  const long = blocks.map((b, i) => (/^<p/i.test(b) && words(textOf(b)) >= 15 ? i : -1)).filter(i => i >= 0);
  if (!long.length) return '';
  const from = Math.max(0, long[0] - 2), to = Math.min(blocks.length, long[long.length - 1] + 3);
  return cleanHtml(blocks.slice(from, to).join('\n'), base);
}

// ---------- tagging (rules) ----------
const THEMES = [
  ['mobility', 'student-flows', 'Student flows', ['student flow', 'international student', 'student mobility', 'study abroad', 'destination', 'outbound']],
  ['mobility', 'visas', 'Visa & immigration policy', ['visa', 'immigration', 'study permit', 'post-study work', 'graduate route', 'migration']],
  ['mobility', 'recruitment', 'Recruitment & admissions', ['recruit', 'enrolment', 'enrollment', 'admission', 'agent', 'deposit', 'applicant']],
  ['mobility', 'tne', 'TNE & partnerships', ['transnational', ' tne', 'branch campus', 'joint degree', 'dual degree', 'double degree', 'offshore campus']],
  ['mobility', 'affordability', 'Affordability & scholarships', ['tuition', 'scholarship', 'cost of living', 'affordab', 'student loan', 'bursar']],
  ['institutions', 'rankings', 'Rankings & reputation', ['ranking', 'ranked', 'reputation', 'league table', 'world university rankings']],
  ['institutions', 'finance', 'Financial sustainability', ['deficit', 'financial sustainab', 'budget', 'revenue', 'funding cut', 'insolven', 'redundanc']],
  ['institutions', 'leadership', 'Leadership & governance', ['vice-chancellor', 'president', 'provost', 'dean', 'leadership', 'governance', 'appointed']],
  ['institutions', 'research', 'Research', ['research', 'citation', 'phd', 'doctoral', 'innovation ecosystem']],
  ['institutions', 'policy', 'Higher education policy', ['policy', 'government', 'regulat', 'ministry', 'legislation', 'strategy']],
  ['skills', 'employability', 'Employability & outcomes', ['employab', 'graduate outcome', 'career', 'job market', 'labour market', 'labor market', 'hiring']],
  ['skills', 'employers', 'Employer partnerships', ['employer', 'industry partner', 'apprentice', 'work-based', 'internship', 'degree on the job']],
  ['skills', 'workforce', 'Skills & workforce', ['skill', 'reskill', 'upskill', 'workforce', 'micro-credential', 'lifelong learning']],
  ['innovation', 'ai', 'AI in higher education', ['artificial intelligence', ' ai ', ' ai,', ' ai.', 'genai', 'generative ai', 'chatgpt', 'llm', 'machine learning']],
  ['innovation', 'digital', 'Digital & EdTech', ['digital', 'online learning', 'edtech', 'platform', 'technology', 'virtual']],
  ['innovation', 'assessment', 'Teaching & assessment', ['assessment', 'academic integrity', 'exam', 'pedagog', 'teaching']],
  ['innovation', 'sustainability', 'Climate & sustainability', ['climate', 'net zero', 'sustainable development', 'sdg']]
];
export const THEME_LABELS = Object.fromEntries(THEMES.map(([d, id, label]) => [`${d}.${id}`, label]));
const REGIONS = {
  Europe: ['united kingdom', ' uk ', ' uk,', ' uk.', 'england', 'scotland', 'wales', 'ireland', 'germany', 'france', 'netherlands', 'spain', 'italy', 'sweden', 'denmark', 'finland', 'norway', 'poland', 'switzerland', 'austria', 'belgium', 'portugal', 'europe'],
  Americas: ['united states', ' us ', ' u.s.', 'american', 'canada', 'mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru', 'latin america'],
  'Asia Pacific': ['australia', 'new zealand', 'china', 'chinese', 'japan', 'korea', 'singapore', 'malaysia', 'indonesia', 'vietnam', 'philippines', 'thailand', 'hong kong', 'taiwan', 'asia'],
  'South Asia': ['india', 'indian', 'pakistan', 'bangladesh', 'nepal', 'sri lanka'],
  'Middle East': ['saudi', 'uae', 'united arab emirates', 'dubai', 'abu dhabi', 'qatar', 'oman', 'kuwait', 'bahrain', 'jordan', 'iran', 'israel', 'turkey', 'egypt', 'middle east', 'gulf'],
  Africa: ['nigeria', 'kenya', 'ghana', 'south africa', 'rwanda', 'ethiopia', 'uganda', 'tanzania', 'morocco', 'africa']
};
const SERIES_THEMES = [[/student flows/i, 'mobility.student-flows'], [/skills/i, 'skills.workforce'], [/ai|digital/i, 'innovation.ai'], [/power moves/i, 'institutions.leadership']];
const AUDIENCE = { mobility: ['Recruitment', 'Partnerships', 'Strategy'], institutions: ['Executive', 'Strategy', 'Research'], skills: ['Careers', 'Strategy'], innovation: ['Digital', 'Executive'] };

function tag(item) {
  const hay = ` ${item.title} ${item.title} ${item.title} ${item.text.slice(0, 6000)} `.toLowerCase();
  const scores = THEMES.map(([d, id, , kws]) => ({ key: `${d}.${id}`, d, n: kws.reduce((a, k) => a + (hay.split(k).length - 1), 0) }));
  for (const [re, key] of SERIES_THEMES) if (item.series && re.test(item.series)) { const s = scores.find(x => x.key === key); if (s) s.n += 4; }
  const top = scores.filter(s => s.n >= 2).sort((a, b) => b.n - a.n).slice(0, 3);
  const max = top[0]?.n || 1;
  item.themes = top.map(s => ({ id: s.key, label: THEME_LABELS[s.key], confidence: Math.min(0.95, +(0.45 + 0.5 * (s.n / max) * Math.min(1, s.n / 6)).toFixed(2)) }));
  item.domains = [...new Set(top.map(s => s.d))];
  item.regions = Object.entries(REGIONS).filter(([, kws]) => kws.some(k => hay.includes(k))).map(([r]) => r).slice(0, 4);
  item.audience = [...new Set(item.domains.flatMap(d => AUDIENCE[d]))];
  item.tagMethod = 'rules-v1';
  return item;
}

// ---------- fetching ----------
const robotsCache = {};
async function allowed(url) {
  const u = new URL(url);
  if (!(u.origin in robotsCache)) {
    robotsCache[u.origin] = [];
    try {
      const r = await fetch(u.origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
      if (r.ok) { let applies = false; for (const raw of (await r.text()).split('\n')) { const line = raw.split('#')[0].trim(); const i = line.indexOf(':'); if (i < 0) continue; const k = line.slice(0, i).trim().toLowerCase(), v = line.slice(i + 1).trim(); if (k === 'user-agent') applies = v === '*'; else if (applies && k === 'disallow' && v) robotsCache[u.origin].push(v); } }
    } catch { /* unreachable robots.txt: treat as no rules */ }
  }
  return !robotsCache[u.origin].some(r => u.pathname.startsWith(r));
}
async function get(url, { accept = 'text/html', conditional = false } = {}) {
  if (!(await allowed(url))) throw new Error('Blocked by robots.txt');
  const headers = { 'User-Agent': UA, Accept: accept };
  if (conditional && state.etags[url]) headers['If-None-Match'] = state.etags[url];
  await sleep(DELAY_MS);
  let r;
  try { r = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(20000) }); }
  catch (e) { throw new Error(`could not connect to ${new URL(url).hostname} (${e.cause?.code || e.name || e.message})`); }
  if (r.status === 304) return { notModified: true };
  if (r.status === 404) return { notFound: true };
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const et = r.headers.get('etag'); if (et) state.etags[url] = et;
  return { body: (await r.text()).slice(0, 4_000_000), url: r.url };
}

// ---------- newsletters ----------
function parseRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const x = m[1];
    const f = n => cdata(x.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)<\\/${n}>`))?.[1] || '');
    return {
      title: decode(f('title')).trim(), link: decode(f('link')).trim(), guid: decode(f('guid')).trim(), pubDate: f('pubDate'), author: decode(f('dc:creator')).trim(),
      categories: [...x.matchAll(/<category>([\s\S]*?)<\/category>/g)].map(c => decode(cdata(c[1])).trim()),
      description: decode(f('description')), html: f('content:encoded'), image: x.match(/<media:content[^>]+url="([^"]+)"/)?.[1] || null
    };
  });
}
const PROMO = /(register (now|today|here)|book (now|your)|sign[- ]?up|subscribe|early[- ]bird|save your (seat|spot)|get your (ticket|pass)|join us (at|in|for)|use (the )?code|limited places|apply now|nominations? (are )?open)/i;

export function segmentPost(post, base) {
  const html = cleanHtml(post.html, base);
  const series = post.categories.find(c => !/^#/.test(c)) || 'QS Newsletter';
  const issueId = `nl-${slugOf(post.link)}`;
  const common = { source: 'newsletters', sourceLabel: 'QS Newsletters', series, issueId, issueTitle: post.title, issueUrl: post.link, published: new Date(post.pubDate || Date.now()).toISOString(), author: post.author || null };
  const noSplit = /chart|power moves/i.test(series);
  const h2 = (html.match(/<h2\b/gi) || []).length, h3 = (html.match(/<h3\b/gi) || []).length;
  const level = noSplit ? null : h2 >= 2 ? 'h2' : h3 >= 2 ? 'h3' : null;
  let parts = [];
  if (!level) parts = [{ title: post.title, html, anchor: null }];
  else {
    const re = new RegExp(`<${level}\\b[^>]*>[\\s\\S]*?<\\/${level}>`, 'gi');
    const heads = [...html.matchAll(re)];
    const intro = html.slice(0, heads[0].index);
    if (words(textOf(intro)) >= 60) parts.push({ title: post.title, html: intro, anchor: null, intro: true });
    heads.forEach((h, i) => {
      const end = i + 1 < heads.length ? heads[i + 1].index : html.length;
      parts.push({ title: textOf(h[0]), html: html.slice(h.index + h[0].length, end), anchor: attrs(h[0].match(/^<[^>]+>/)[0]).id || null });
    });
    // merge fragments under 40 words (without media) into the previous part
    const merged = [];
    for (const p of parts) {
      const w = words(textOf(p.html)), hasMedia = /<(img|iframe|video)\b/i.test(p.html);
      if (merged.length && w < 40 && !hasMedia && !PROMO.test(p.title + ' ' + textOf(p.html))) { const last = merged[merged.length - 1]; last.html += `\n<h3>${p.title}</h3>\n${p.html}`; }
      else merged.push(p);
    }
    parts = merged;
  }
  const out = [];
  parts.forEach((p, i) => {
    const text = textOf(p.html); const w = words(text);
    const media = mediaOf(p.html);
    let type = w < 250 ? 'News brief' : 'Feature';
    if (PROMO.test(p.title + ' ' + text.slice(0, 400)) && w < 160) type = 'Promo';
    else if (/chart/i.test(series) || (/chart|graph|data/i.test(p.title) && media.images.length)) type = 'Chart';
    else if (/power moves/i.test(series)) type = 'People moves';
    else if (p.intro) type = 'Editor’s introduction';
    if (!text && !media.images.length && !media.videos.length) return;
    out.push(tag({
      ...common, id: `${issueId}-${i}`, position: i, title: p.title || post.title, html: p.html, text, words: w, type,
      summary: text.split(/\s+/).slice(0, 45).join(' ') + (w > 45 ? '…' : ''),
      url: p.anchor ? `${post.link.replace(/#.*$/, '')}#${p.anchor}` : post.link,
      image: media.images[0]?.src || (i === 0 ? absUrl(post.image, base) : null), images: media.images, videos: media.videos,
      sponsored: /sponsored|in partnership with|partner content/i.test(text.slice(0, 300)), status: 'ok'
    }));
  });
  return out;
}

async function newslettersFromRss(log) {
  const posts = [];
  for (let page = 1; page <= NEWSLETTER_RSS_PAGES; page++) {
    const url = page === 1 ? `${NEWSLETTER_BASE}/rss/` : `${NEWSLETTER_BASE}/rss/${page}/`;
    const r = await get(url, { accept: 'application/rss+xml, application/xml, text/xml' });
    if (r.notFound) break;
    const items = parseRss(r.body || '');
    if (!items.length) { if (page === 1) throw new Error('RSS feed has no items'); break; }
    posts.push(...items);
    log.push(`RSS page ${page}: ${items.length} posts`);
  }
  return posts;
}
async function newslettersFromSitemap(log) {
  let r = await get(`${NEWSLETTER_BASE}/sitemap-posts.xml`, { accept: 'application/xml' });
  if (r.notFound) r = await get(`${NEWSLETTER_BASE}/sitemap.xml`, { accept: 'application/xml' });
  const urls = [...(r.body || '').matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map(m => ({ url: decode(m[1]), lastmod: m[2] || '' }))
    .filter(u => !/\/(tag|author|page)\//.test(u.url)).sort((a, b) => b.lastmod.localeCompare(a.lastmod)).slice(0, NEWSLETTER_RSS_PAGES * 15);
  log.push(`Sitemap: ${urls.length} posts`);
  const posts = [];
  for (const u of urls) {
    try {
      const p = await get(u.url); if (!p.body) continue;
      posts.push({ title: meta(p.body, 'og:title') || textOf(p.body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]), link: u.url, pubDate: meta(p.body, 'article:published_time') || u.lastmod, author: meta(p.body, 'author'), categories: [meta(p.body, 'article:tag')].filter(Boolean), description: meta(p.body, 'description'), html: p.body.match(/<section[^>]+class="[^"]*(gh-content|post-content|article-content)[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[2] || mainContent(p.body, u.url), image: absUrl(meta(p.body, 'og:image'), u.url) });
    } catch (e) { log.push(`Post failed ${u.url}: ${e.message}`); }
  }
  return posts;
}

async function ingestNewsletters() {
  const log = []; const stat = { id: 'newsletters', name: 'QS Newsletters', base: NEWSLETTER_BASE, startedAt: new Date().toISOString(), method: 'rss', found: 0, added: 0, updated: 0, unchanged: 0, skippedPromo: 0, errors: [] };
  let posts = [];
  try { posts = await newslettersFromRss(log); } catch (e) {
    stat.errors.push(`RSS: ${e.message}`); stat.method = 'sitemap';
    try { posts = await newslettersFromSitemap(log); } catch (e2) { stat.errors.push(`Sitemap: ${e2.message}`); }
  }
  stat.found = posts.length;
  for (const post of posts) {
    try {
      for (const it of segmentPost(post, post.link || NEWSLETTER_BASE)) {
        if (it.type === 'Promo') { stat.skippedPromo++; continue; }
        upsert(it, stat);
      }
    } catch (e) { stat.errors.push(`${post.link}: ${e.message}`); }
  }
  stat.finishedAt = new Date().toISOString(); stat.log = log.slice(-20);
  stat.status = !posts.length ? 'failed' : stat.errors.length ? 'partial' : 'ok';
  state.sources.newsletters = stat;
}

// ---------- magazine ----------
const EDITION_RE = /\/qs-insights-magazine-0?(\d+)(?:\/([a-z0-9][a-z0-9-]*))?\/?/gi;
const NON_ARTICLE = /^(cover|contents|editions|pdf|pdf-.*|subscribe|advertise|back-cover)$/i;

export function parseEditionLinks(html, n) {
  const seen = new Set(); const out = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1]; const mm = [...href.matchAll(EDITION_RE)][0];
    if (!mm || Number(mm[1]) !== n || !mm[2] || NON_ARTICLE.test(mm[2]) || seen.has(mm[2])) continue;
    seen.add(mm[2]); out.push({ slug: mm[2], linkText: textOf(m[2]).slice(0, 200) });
  }
  return out;
}
export function parseMagazineArticle(html, url, n) {
  const strip = t => t.replace(/\s*[-|–]\s*QS Insights Magazine\s*\d+\s*$/i, '').trim();
  const title = strip(meta(html, 'og:title') || textOf(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || textOf(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]));
  let body = mainContent(html, url);
  body = body.replace(new RegExp(`^\\s*<h2>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h2>`), '');
  const text = textOf(body); const w = words(text);
  const description = meta(html, 'og:description') || meta(html, 'description');
  const byline = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].slice(0, 4).map(m => textOf(m[1])).find(t => /^By\s/.test(t) && words(t) <= 14);
  const by = meta(html, 'author') || byline?.match(/^By\s+([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){0,3})/)?.[1] || null;
  const dateRaw = meta(html, 'article:published_time') || html.match(/<time[^>]+datetime="([^"]+)"/i)?.[1] || text.slice(0, 600).match(/\b(\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d)\b/)?.[1];
  const media = mediaOf(body);
  const slug = slugOf(url);
  const probe = `${slug} ${title} ${text.slice(0, 500)}`;
  let type = 'Feature';
  if (/opinion|op-ed|viewpoint|comment/i.test(probe)) type = 'Opinion';
  else if (/summit|roundtable|conference|forum/i.test(title)) type = 'Event write-up';
  else if (/^(dr|prof|professor)-/i.test(slug) || /\binterview\b|\bprofile\b/i.test(probe)) type = 'Profile';
  else if (/introduction|welcome|editor/i.test(slug)) type = 'Editor’s introduction';
  else if (w < 300) type = 'Briefing';
  return tag({
    id: `mag-${n}-${slug}`, source: 'magazine', sourceLabel: 'QS Insights Magazine', series: `QS Insights Magazine ${n}`, editionN: n,
    title: title || slug.replace(/-/g, ' '), html: body, text, words: w, type, author: by, url,
    published: dateRaw && !Number.isNaN(Date.parse(dateRaw)) ? new Date(dateRaw).toISOString() : null,
    summary: description || text.split(/\s+/).slice(0, 45).join(' ') + (w > 45 ? '…' : ''),
    image: absUrl(meta(html, 'og:image'), url) || media.images[0]?.src || null, images: media.images, videos: media.videos,
    sponsored: /spotlight|sponsored|in partnership with|partner content|advertorial/i.test(probe),
    status: w >= 50 ? 'ok' : 'partial'
  });
}

async function ingestMagazine() {
  const log = []; const stat = { id: 'magazine', name: 'QS Insights Magazine', base: MAGAZINE_BASE, startedAt: new Date().toISOString(), method: 'pages', found: 0, added: 0, updated: 0, unchanged: 0, partial: 0, errors: [] };
  let editions = MAGAZINE_EDITIONS.slice();
  if (!editions.length) {
    try {
      const home = await get(`${MAGAZINE_BASE}/`);
      const nums = [...new Set([...(home.body || '').matchAll(EDITION_RE)].map(m => Number(m[1])))].sort((a, b) => b - a);
      log.push(`Home page lists editions: ${nums.slice(0, 8).join(', ') || 'none'}`);
      // editions the home page links to come first, then a count-down from the latest to fill gaps
      const latest = nums[0];
      if (latest) editions = [...new Set([...nums, ...Array.from({ length: MAGAZINE_EDITION_COUNT * 2 }, (_, k) => latest - k).filter(x => x > 0)])].sort((a, b) => b - a);
    } catch (e) { stat.errors.push(`Home page: ${e.message}`); }
  }
  if (!editions.length) { editions = [46, 40]; log.push('No editions discovered; using fallback 46, 40'); }
  const want = MAGAZINE_EDITIONS.length || MAGAZINE_EDITION_COUNT; let done = 0;
  for (const n of editions) {
    if (done >= want) break;
    const coverUrl = `${MAGAZINE_BASE}/qs-insights-magazine-${n}/`;
    try {
      let cover = await get(coverUrl);
      if (cover.notFound && n < 10) cover = await get(`${MAGAZINE_BASE}/qs-insights-magazine-0${n}/`);
      if (cover.notFound) { (MAGAZINE_EDITIONS.length ? stat.errors : log).push(`Edition ${n}: not found`); continue; }
      done++;
      const links = parseEditionLinks(cover.body, n);
      log.push(`Edition ${n}: ${links.length} articles listed`);
      const ed = state.editions[n] || {};
      state.editions[n] = { n, url: coverUrl, title: (meta(cover.body, 'og:title') || `QS Insights Magazine ${n}`).replace(/^Cover\s*[-–|]\s*/i, ''), image: absUrl(meta(cover.body, 'og:image'), coverUrl) || ed.image || null, description: meta(cover.body, 'og:description') || '', order: links.map(l => `mag-${n}-${l.slug}`), fetchedAt: new Date().toISOString() };
      stat.found += links.length;
      for (const l of links) {
        const url = `${MAGAZINE_BASE}/qs-insights-magazine-${n}/${l.slug}`;
        try {
          const page = await get(url); if (!page.body) continue;
          const it = parseMagazineArticle(page.body, page.url || url, n);
          if (!it.title || it.title.length < 3) it.title = l.linkText || it.title;
          if (it.status === 'partial') stat.partial++;
          upsert(it, stat);
        } catch (e) { stat.errors.push(`${url}: ${e.message}`); }
      }
      // date-less articles take the edition date of the newest dated article, or the fetch date
      const dated = state.editions[n].order.map(id => state.items[id]?.published).filter(Boolean).sort().pop();
      for (const id of state.editions[n].order) { const it = state.items[id]; if (it && !it.published) it.published = dated || state.editions[n].fetchedAt; }
      state.editions[n].published = dated || state.editions[n].fetchedAt;
    } catch (e) { stat.errors.push(`Edition ${n}: ${e.message}`); }
  }
  stat.finishedAt = new Date().toISOString(); stat.log = log.slice(-20);
  stat.status = !stat.found ? 'failed' : stat.errors.length || stat.partial ? 'partial' : 'ok';
  state.sources.magazine = stat;
}

function upsert(it, stat) {
  const h = hash(it.html + it.title);
  const prev = state.items[it.id];
  if (prev && prev.hash === h) { stat.unchanged++; prev.lastSeen = new Date().toISOString(); return; }
  state.items[it.id] = { ...it, hash: h, firstSeen: prev?.firstSeen || new Date().toISOString(), updatedAt: prev ? new Date().toISOString() : null, lastSeen: new Date().toISOString() };
  prev ? stat.updated++ : stat.added++;
}

export async function runIngest(reason = 'scheduled') {
  if (state.running) return { started: false, message: 'Content ingestion is already running.' };
  if (!LIVE) return { started: false, message: 'Live fetching is switched off (QS_LIVE_FETCH=0).' };
  state.running = true;
  (async () => {
    const started = new Date().toISOString();
    try { await ingestNewsletters(); } catch (e) { state.sources.newsletters = { id: 'newsletters', name: 'QS Newsletters', status: 'failed', errors: [e.message], finishedAt: new Date().toISOString() }; }
    try { await ingestMagazine(); } catch (e) { state.sources.magazine = { id: 'magazine', name: 'QS Insights Magazine', status: 'failed', errors: [e.message], finishedAt: new Date().toISOString() }; }
    state.lastRun = { started, finished: new Date().toISOString(), reason, items: Object.keys(state.items).length };
    state.running = false; saveContent();
    if (!Object.keys(state.items).length) setTimeout(() => runIngest('retry'), 30 * 60e3).unref(); // nothing read yet: try again sooner
    console.log(`[content] ingestion finished: ${Object.keys(state.items).length} items (newsletters ${state.sources.newsletters?.status}, magazine ${state.sources.magazine?.status})`);
  })().catch(e => { state.running = false; console.error('[content] ingestion crashed', e); });
  return { started: true, message: 'Reading QS newsletters and the magazine. This takes a few minutes the first time.' };
}

export function startContentScheduler() {
  loadContent();
  const last = state.lastRun?.finished ? Date.parse(state.lastRun.finished) : 0;
  if (Date.now() - last > INGEST_HOURS * 3600e3) setTimeout(() => runIngest('startup'), 3000);
  setInterval(() => runIngest('scheduled'), INGEST_HOURS * 3600e3).unref();
}

// ---------- read API ----------
export function allItems({ includeHidden = false } = {}) {
  const now = Date.now();
  return Object.values(state.items).map(it => {
    const o = state.overrides[it.id] || {};
    const pinned = !!o.pinned && (!o.pinUntil || Date.parse(o.pinUntil) > now);
    return { ...it, pinned, hidden: !!o.hidden };
  }).filter(it => includeHidden || !it.hidden);
}
export const getItem = id => allItems({ includeHidden: true }).find(i => i.id === id);
export const getEditions = () => Object.values(state.editions).sort((a, b) => b.n - a.n);
export function setOverride(id, patch) { state.overrides[id] = { ...(state.overrides[id] || {}), ...patch }; saveContent(); return state.overrides[id]; }
export const getStatus = () => ({ live: LIVE, running: state.running, lastRun: state.lastRun, sources: state.sources, items: Object.keys(state.items).length, editions: Object.keys(state.editions).length, everyHours: INGEST_HOURS, config: { NEWSLETTER_BASE, MAGAZINE_BASE, NEWSLETTER_RSS_PAGES, MAGAZINE_EDITION_COUNT, MAGAZINE_EDITIONS } });
export const getMessages = () => state.messages.filter(m => !m.until || Date.parse(m.until) > Date.now());
export function addMessage(m) { state.messages.unshift(m); saveContent(); return m; }
export function removeMessage(id) { state.messages = state.messages.filter(m => m.id !== id); saveContent(); }

// Staff-added videos for the media library. PoC: by link (YouTube, Vimeo, Wistia, Loom or a direct .mp4).
// Uploading video files needs object storage and transcoding; see requirements REQ-MED-3.
export function toEmbed(url) {
  const u = new URL(url);
  const yt = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : /youtube\.com$/.test(u.hostname.replace(/^www\./, '')) ? (u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]) : null;
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt}`, kind: 'embed', poster: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
  const vm = u.hostname.endsWith('vimeo.com') && u.pathname.match(/(\d{6,})/)?.[1];
  if (vm) return { src: `https://player.vimeo.com/video/${vm}`, kind: 'embed', poster: null };
  if (VIDEO_HOSTS.includes(u.hostname)) return { src: u.href, kind: 'embed', poster: null };
  if (/\.(mp4|webm|m4v)$/i.test(u.pathname)) return { src: u.href, kind: 'file', poster: null };
  throw Object.assign(new Error('Use a YouTube, Vimeo, Wistia or Loom link, or a direct .mp4 / .webm file link.'), { status: 400 });
}
export function addLibraryItem({ title, url, description, themes, addedBy }) {
  let v; try { v = toEmbed(url); } catch (e) { if (e.status) throw e; throw Object.assign(new Error('That is not a valid link.'), { status: 400 }); }
  const html = `${v.kind === 'embed' ? `<iframe src="${v.src}" allowfullscreen></iframe>` : `<video src="${v.src}" controls></video>`}${description ? description.split(/\n{2,}/).map(p => `<p>${p.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</p>`).join('') : ''}`;
  const it = tag({ id: `lib-${hash(v.src + Date.now())}`, source: 'library', sourceLabel: 'QS One media library', series: 'Video', title, html, text: description || '', words: words(description || ''), type: 'Video', author: null, url, published: new Date().toISOString(), summary: (description || '').slice(0, 240), image: v.poster, images: [], videos: [v], sponsored: false, status: 'ok', addedBy });
  const chosen = themes.filter(t => THEME_LABELS[t]).map(t => ({ id: t, label: THEME_LABELS[t], confidence: 1 }));
  if (chosen.length) { it.themes = chosen; it.domains = [...new Set(chosen.map(t => t.id.split('.')[0]))]; it.audience = [...new Set(it.domains.flatMap(d => AUDIENCE[d]))]; it.tagMethod = 'manual'; }
  state.items[it.id] = { ...it, hash: hash(html), firstSeen: it.published, lastSeen: it.published };
  saveContent();
  return it;
}
