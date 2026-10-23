import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Tag, Lock, Link, Ext, SourceBadge, Empty, Modal, fmtDate, ago } from '../ui.jsx';

// Real content from QS Newsletters and QS Insights Magazine, read by server/ingest.js.
// The library is free. The curated "For you" feed is included from Member.
const VIDEO_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com', 'player.vimeo.com', 'fast.wistia.net', 'www.loom.com'];
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') { let ok = false; try { ok = VIDEO_HOSTS.includes(new URL(node.getAttribute('src') || '').hostname); } catch { /* bad url */ } if (!ok) node.parentNode?.removeChild(node); }
});
DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
  if (node.tagName === 'IMG') { node.setAttribute('loading', 'lazy'); node.setAttribute('referrerpolicy', 'no-referrer'); }
  if (node.tagName === 'IFRAME') { node.setAttribute('loading', 'lazy'); node.setAttribute('allow', 'fullscreen; picture-in-picture'); }
});
const clean = html => DOMPurify.sanitize(html || '', { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'target', 'loading', 'referrerpolicy', 'allow'], FORBID_ATTR: ['style', 'class'] });

const premium = ent => ent.kind === 'staff' || (ent.kind === 'member' && ent.rank >= 1);
const sourceHost = it => { try { return new URL(it.url).hostname.replace(/^www\./, ''); } catch { return 'source'; } };

export function DigestCta({ compact }) {
  const { boot } = useApp();
  return (
    <div className={`digest ${compact ? 'compact' : ''}`}>
      <div><strong>Get the QS weekly digest</strong><span className="meta">The QS newsletters in your inbox each week. Sign-up is handled by QS Newsletters.</span></div>
      <a className="btn amber" href={boot.digestUrl} target="_blank" rel="noopener noreferrer">Sign up ↗</a>
    </div>
  );
}

function StaffControls({ item, onChange }) {
  const { ent, toast } = useApp();
  if (ent.kind !== 'staff') return null;
  async function set(patch, msg) { try { const r = await api(`content/${encodeURIComponent(item.id)}`, { method: 'PATCH', body: patch }); toast(msg); onChange?.(r); } catch (e) { toast(e.message, true); } }
  return (
    <span className="staff-ctl">
      <button className="btn sm ghost" onClick={() => set(item.pinned ? { pinned: false } : { pinned: true, pinDays: 14 }, item.pinned ? 'Unpinned.' : 'Pinned to the top for 14 days.')}>{item.pinned ? 'Unpin' : 'Pin'}</button>
      <button className="btn sm ghost" onClick={() => set({ hidden: !item.hidden }, item.hidden ? 'Shown again.' : 'Hidden from members.')}>{item.hidden ? 'Unhide' : 'Hide'}</button>
    </span>
  );
}

export function ContentCard({ item, onChange, compact }) {
  return (
    <article className={`card content-card ${item.hidden ? 'is-hidden' : ''}`}>
      {item.image && !compact && <Link to={`intelligence/a/${encodeURIComponent(item.id)}`} className="thumb" aria-hidden="true" tabIndex={-1}><img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.parentNode.style.display = 'none'; }} /></Link>}
      <div className="card-top">
        {item.pinned && <Tag tone="navy">Pinned</Tag>}
        <span className="src-name">{item.series}</span><span>· {fmtDate(item.published)}</span>
      </div>
      <h3><Link to={`intelligence/a/${encodeURIComponent(item.id)}`} className="">{item.title}</Link></h3>
      {!compact && <p>{item.summary}</p>}
      <div className="card-top">
        <Tag tone="amber">{item.type}</Tag>
        {item.sponsored && <Tag tone="outline">Sponsored</Tag>}
        {item.themes.slice(0, 2).map(t => <Tag key={t.id}>{t.label}</Tag>)}
      </div>
      <div className="card-foot">
        <span className="meta">{item.readMins} min read{item.videoCount ? ' · ▶ video' : ''}{item.status === 'partial' ? ' · summary only' : ''}</span>
        <StaffControls item={item} onChange={onChange} />
      </div>
      {item.reasons && <div className="why">Why you see this: {item.reasons.join(' · ')}</div>}
    </article>
  );
}

function NoContent() {
  const { boot, ent } = useApp();
  const st = boot.content.ingest;
  return (
    <div className="notice left grey">
      {st.running || !st.lastRun ? 'QS One is reading the QS newsletters and Insights Magazine for the first time. This takes a few minutes. Reload the page shortly.' : 'No articles have been read yet. The server may not be able to reach newsletters.qs.com or magazine.qs.com.'}
      {ent.kind === 'staff' && <> See <Link to="intelligence/sources">content sources</Link> for details.</>}
    </div>
  );
}

const TABS = [['intelligence', 'For you'], ['intelligence/latest', 'Latest from QS'], ['intelligence/magazine', 'Insights Magazine'], ['intelligence/media', 'Media library']];
function Tabs({ at }) { return <div className="seg tabs" role="tablist">{TABS.map(([to, l]) => <a key={to} href={`#/${to}`} className={at === to ? 'on' : ''} role="tab" aria-selected={at === to}>{l}</a>)}</div>; }

export function Intelligence({ tab }) {
  const { ent } = useApp();
  const at = tab ? `intelligence/${tab}` : 'intelligence';
  return (
    <>
      <PageTitle title="Intelligence" lede="Articles from QS Newsletters and QS Insights Magazine, broken into individual stories and tagged by theme. The library is free. Your curated feed is included from Member." />
      <Tabs at={at} />
      <div style={{ height: 20 }} />
      {tab === 'latest' ? <Latest /> : tab === 'magazine' ? <Editions /> : tab === 'media' ? <Media /> : <ForYou premium={premium(ent)} />}
    </>
  );
}

function ForYou({ premium: isPremium }) {
  const { boot, me } = useApp();
  const [d, setD] = useState(null);
  const load = () => api('content?view=foryou&limit=24').then(setD).catch(() => setD({ items: [], total: 0 }));
  useEffect(() => { load(); }, []);
  if (!d) return <p className="muted">Loading…</p>;
  const interests = me.interests.map(i => boot.domains.find(x => x.id === i)?.short).join(', ');
  return (
    <>
      <Panel title="Curated for you" sub={`Ranked by your interests (${interests}), your regions and how recent each story is. Items pinned by QS come first.`} action={<Link to="profile">Change interests →</Link>}>
        {!d.items.length ? <NoContent /> : <div className="grid g3">{d.items.map(i => <ContentCard key={i.id} item={i} onChange={load} />)}</div>}
        {d.locked && d.items.length > 0 && (
          <div className="lock-panel" style={{ marginTop: 20 }}>
            <strong>🔒 {d.lockedMessage}</strong>
            <span className="meta">You are seeing the top three. Every article stays free to read in Latest from QS.</span>
            <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link to="intelligence/latest" className="btn ghost">Browse the free library</Link><Link to="membership/plans" className="btn amber">See plans</Link></span>
          </div>
        )}
      </Panel>
      <DigestCta />
    </>
  );
}

function Latest() {
  const { boot, ent } = useApp();
  const [f, setF] = useState({ q: '', theme: '', source: '', type: '' });
  const [d, setD] = useState(null);
  const qs = useMemo(() => Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&'), [f]);
  const load = () => api(`content?view=latest&limit=90${qs ? '&' + qs : ''}${ent.kind === 'staff' ? '&hidden=1' : ''}`).then(setD);
  useEffect(() => { const t = setTimeout(load, f.q ? 250 : 0); return () => clearTimeout(t); }, [qs]);
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  return (
    <Panel title="Latest from QS" sub="Every story from QS Newsletters and QS Insights Magazine, newest first. Free for everyone." action={null}>
      <div className="filters">
        <label className="field"><span>Search</span><input className="input" value={f.q} onChange={set('q')} placeholder="Title, author or series" /></label>
        <label className="field"><span>Theme</span><select className="select" value={f.theme} onChange={set('theme')}><option value="">All themes</option>{(d?.facets.themes || []).map(t => <option key={t.value} value={t.value}>{t.label} ({t.n})</option>)}</select></label>
        <label className="field"><span>Source</span><select className="select" value={f.source} onChange={set('source')}><option value="">All sources</option><option value="newsletters">QS Newsletters</option><option value="magazine">QS Insights Magazine</option><option value="library">Media library</option></select></label>
        <label className="field"><span>Format</span><select className="select" value={f.type} onChange={set('type')}><option value="">All formats</option>{(d?.facets.types || []).map(t => <option key={t.value} value={t.value}>{t.value} ({t.n})</option>)}</select></label>
      </div>
      {!d ? <p className="muted">Loading…</p> : !d.status.items ? <NoContent /> : d.items.length ? <><p className="meta">{d.total} stor{d.total === 1 ? 'y' : 'ies'}</p><div className="grid g3">{d.items.map(i => <ContentCard key={i.id} item={i} onChange={load} />)}</div></> : <Empty>Nothing matches these filters.</Empty>}
    </Panel>
  );
}

function Editions() {
  const [d, setD] = useState(null);
  useEffect(() => { api('editions').then(setD); }, []);
  if (!d) return <p className="muted">Loading…</p>;
  if (!d.editions.length) return <NoContent />;
  return d.editions.map(e => (
    <Panel key={e.n} title={e.title} sub={`${e.articles.length} articles · read ${ago(e.fetchedAt)}`} action={<Ext href={e.url}>Open on magazine.qs.com ↗</Ext>}>
      <div className="edition">
        {e.image && <img className="cover" src={e.image} alt={`Cover of ${e.title}`} referrerPolicy="no-referrer" onError={ev => { ev.currentTarget.style.display = 'none'; }} />}
        <div className="grid g3">{e.articles.map(a => <ContentCard key={a.id} item={a} compact />)}</div>
      </div>
    </Panel>
  ));
}

function Media() {
  const { boot, ent, toast } = useApp();
  const [kind, setKind] = useState('all');
  const [d, setD] = useState(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', url: '', description: '', themes: [] });
  const load = () => api(`media${kind === 'video' ? '?kind=video' : ''}`).then(setD);
  useEffect(() => { load(); }, [kind]);
  async function add(e) {
    e.preventDefault();
    try { await api('media', { method: 'POST', body: f }); toast('Video added to the media library.'); setAdding(false); setF({ title: '', url: '', description: '', themes: [] }); load(); } catch (err) { toast(err.message, true); }
  }
  const themeOpts = Object.entries(boot.themeLabels);
  return (
    <Panel title="Media library" sub="Images and videos synced from QS articles, plus videos added by the QS team. Each links back to its story." action={ent.kind === 'staff' ? <button className="btn amber" onClick={() => setAdding(true)}>Add a video</button> : null}>
      <div className="filters"><div className="seg" role="group">{[['all', 'All media'], ['video', 'Videos only']].map(([k, l]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}</div></div>
      {!d ? <p className="muted">Loading…</p> : !d.media.length ? <Empty>No images or videos yet. They appear here as articles are read.</Empty> : (
        <div className="media-grid">{d.media.map(m => (
          <figure key={m.src} className="media-item">
            {m.kind === 'video' ? (m.videoKind === 'file' ? <video src={m.src} poster={m.poster || undefined} controls preload="none" /> : <iframe src={m.src} title={m.title} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen />) : <img src={m.src} alt={m.alt || ''} loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.closest('figure').style.display = 'none'; }} />}
            <figcaption><Link to={`intelligence/a/${encodeURIComponent(m.itemId)}`}>{m.title}</Link><span className="meta">{m.kind === 'video' ? '▶ Video · ' : ''}{m.source} · {fmtDate(m.published)}</span></figcaption>
          </figure>
        ))}</div>
      )}
      {adding && (
        <Modal title="Add a video" onClose={() => setAdding(false)}>
          <form className="form" onSubmit={add}>
            <label className="field"><span>Title</span><input className="input" required minLength={3} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
            <label className="field"><span>Video link</span><input className="input" required type="url" placeholder="YouTube, Vimeo, Wistia or Loom link, or a direct .mp4 link" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} /></label>
            <label className="field"><span>Description</span><textarea className="textarea" rows={3} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label>
            <fieldset className="field"><span>Themes</span><div className="checks">{themeOpts.map(([id, l]) => <label key={id} className="check"><input type="checkbox" checked={f.themes.includes(id)} onChange={e => setF({ ...f, themes: e.target.checked ? [...f.themes, id] : f.themes.filter(x => x !== id) })} /> {l}</label>)}</div></fieldset>
            <p className="meta">Proof of concept: videos are added by link. Uploading video files needs storage and is planned for a later phase.</p>
            <div className="form-actions"><button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button><button className="btn amber">Add video</button></div>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

export function Article({ id }) {
  const { ent } = useApp();
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api(`content/${encodeURIComponent(id)}`).then(setA).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  const body = useMemo(() => clean(a?.html), [a?.html]);
  if (err) return <><Link to="intelligence/latest" className="back">← Intelligence</Link><div className="notice left grey" style={{ marginTop: 24 }}>{err}</div></>;
  if (!a) return <p className="muted">Loading…</p>;
  const from = a.source === 'magazine' ? `${a.series}` : a.source === 'library' ? 'the QS One media library' : (a.issueTitle && a.issueTitle !== a.title ? (a.issueTitle.startsWith(a.series) ? a.issueTitle : `${a.series}: ${a.issueTitle}`) : a.series);
  return (
    <>
      <Link to={a.source === 'magazine' ? 'intelligence/magazine' : 'intelligence/latest'} className="back">← {a.source === 'magazine' ? 'Insights Magazine' : 'Latest from QS'}</Link>
      <div className="article-head">
        <div className="card-top">{a.pinned && <Tag tone="navy">Pinned</Tag>}<Tag tone="amber">{a.type}</Tag>{a.sponsored && <Tag tone="outline">Sponsored</Tag>}<span>{a.series} · {fmtDate(a.published)} · {a.readMins} min read</span></div>
        <h1 className="page-title">{a.title}</h1>
        {a.author && <p className="byline">By {a.author}</p>}
      </div>
      <div className="two-col">
        <Panel action={null}>
          {a.status === 'partial' && <div className="notice left grey" style={{ marginBottom: 16 }}>Only part of this article could be read automatically. <Ext href={a.url}>Read the full article on {sourceHost(a)} ↗</Ext></div>}
          <div className="reader-body article" dangerouslySetInnerHTML={{ __html: body }} />
          <div className="provenance">Originally published in {from}. <Ext href={a.url}>Read on {sourceHost(a)} ↗</Ext></div>
        </Panel>
        <div className="grid">
          <Panel small title="Themes" action={ent.kind === 'staff' ? <StaffControls item={a} onChange={load} /> : false}>
            <div className="card-top">{a.themes.length ? a.themes.map(t => <Tag key={t.id}>{t.label}</Tag>) : <span className="meta">Not yet tagged</span>}</div>
            {a.regions.length > 0 && <div className="card-top" style={{ marginTop: 10 }}>{a.regions.map(r => <Tag key={r} tone="outline">{r}</Tag>)}</div>}
          </Panel>
          {a.siblings.length > 0 && (
            <Panel small title={a.source === 'magazine' ? `More from ${a.series}` : 'More from this issue'} action={false}>
              {a.siblings.map(s => <div className="row" key={s.id}><span><Link to={`intelligence/a/${encodeURIComponent(s.id)}`}>{s.title}</Link><span className="meta">{s.type}</span></span></div>)}
            </Panel>
          )}
          {a.related.length > 0 && (
            <Panel small title="Related" action={false}>
              {a.related.map(s => <div className="row" key={s.id}><span><Link to={`intelligence/a/${encodeURIComponent(s.id)}`}>{s.title}</Link><span className="meta">{s.series} · {fmtDate(s.published)}</span></span></div>)}
            </Panel>
          )}
          <DigestCta compact />
        </div>
      </div>
    </>
  );
}

export function Sources() {
  const { boot, ent, toast } = useApp();
  const [d, setD] = useState(null);
  const [ing, setIng] = useState(null);
  const load = () => { api('sources').then(setD); if (ent.kind === 'staff') api('ingest').then(setIng); };
  useEffect(() => { load(); }, []);
  const running = d?.status.running || ing?.running;
  useEffect(() => { if (!running) return; const t = setInterval(load, 3000); return () => clearInterval(t); }, [running]);
  async function refreshNow() { try { const r = await api('sources/refresh', { method: 'POST' }); toast(r.message, !r.started); load(); } catch (e) { toast(e.message, true); } }
  async function ingestNow() { try { const r = await api('ingest/run', { method: 'POST' }); toast(r.message, !r.started); load(); } catch (e) { toast(e.message, true); } }
  if (!d) return <p className="muted">Loading…</p>;
  const live = d.sources.filter(s => s.status === 'live').length;
  const tone = s => (s === 'ok' ? 'green' : s === 'partial' ? 'amber' : 'red');
  return (
    <>
      <PageTitle title="Content sources" lede="Where QS One's content comes from. Articles are read from public QS newsletter and magazine pages, split into stories and tagged automatically. Every story links back to where it was first published." />
      <Panel title="QS Newsletters and QS Insights Magazine" sub={`${boot.content.items} stories · ${boot.content.editions} magazine editions · checked every ${boot.content.ingest.everyHours} hours`} action={ent.kind === 'staff' ? <button className="btn amber" onClick={ingestNow} disabled={running}>{ing?.running ? 'Reading…' : 'Check for new content'}</button> : null}>
        {ent.kind !== 'staff' ? <p className="muted">Last checked {boot.content.ingest.lastRun ? ago(boot.content.ingest.lastRun.finished) : 'not yet'}.</p> : !ing ? <p className="muted">Loading…</p> : (
          <div className="scroll"><table className="table"><thead><tr><th>Source</th><th>Status</th><th>Found</th><th>New</th><th>Updated</th><th>Notes</th></tr></thead><tbody>
            {['newsletters', 'magazine'].map(k => { const s = ing.sources[k]; return (
              <tr key={k}><td><strong>{k === 'newsletters' ? 'QS Newsletters' : 'QS Insights Magazine'}</strong><div className="meta">{ing.config[k === 'newsletters' ? 'NEWSLETTER_BASE' : 'MAGAZINE_BASE']}{s?.method ? ` · via ${s.method}` : ''}</div></td>
                <td>{s ? <Tag tone={tone(s.status)}>{s.status}</Tag> : <Tag>not run</Tag>}<div className="meta">{s?.finishedAt ? ago(s.finishedAt) : ''}</div></td>
                <td>{s?.found ?? '–'}</td><td>{s?.added ?? '–'}</td><td>{s?.updated ?? '–'}</td>
                <td className="meta">{[...(s?.log || []), s?.skippedPromo ? `${s.skippedPromo} promotional blocks skipped` : null, s?.partial ? `${s.partial} articles only partly read` : null, ...(s?.errors || []).slice(0, 4)].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}</td></tr>
            ); })}
          </tbody></table></div>
        )}
      </Panel>
      <Panel title="QS data pages" sub="Public qs.com pages behind QS evidence, with short excerpts and a link back." action={ent.kind === 'staff' ? <button className="btn ghost" onClick={refreshNow} disabled={d.status.running}>{d.status.running ? 'Refreshing…' : 'Refresh from qs.com'}</button> : null}>
        <p className="meta">{live}/{d.sources.length} read live · last refresh {d.status.lastRun ? ago(d.status.lastRun.finished) : 'not yet'} · saved copies dated {fmtDate(d.status.snapshotDate)}</p>
        <div className="scroll"><table className="table"><thead><tr><th>Source</th><th>Domain</th><th>Status</th></tr></thead><tbody>
          {d.sources.map(s => <tr key={s.id}><td><strong>{s.title}</strong><div><Ext href={s.url}>{s.url.replace('https://www.', '')}</Ext></div></td><td>{boot.domains.find(x => x.id === s.domain)?.short || 'Events'}</td><td><SourceBadge status={s.status} asOf={s.asOf} /></td></tr>)}
        </tbody></table></div>
      </Panel>
    </>
  );
}
