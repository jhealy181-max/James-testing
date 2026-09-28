import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageTitle, Panel, Tag, Lock, Link, Empty, Info, GroupedBars, HBars, fmtNumDate, fmtDate, until, signed } from '../ui.jsx';

export function StatusCards({ cards, market }) {
  const v = (c, unit = ' pts') => (c ? `${c.market} (${signed(c.v, unit)})` : '–');
  const noPrev = !cards?.prevWave;
  return (
    <div className="status4">
      <div className="status green"><span className="s-head">{market ? 'Strongest market' : 'Strongest vs peers'} <Info tip={market ? 'Highest peer median change in deposits' : 'Where your deposit change is furthest above the peer median'} /></span><span className="s-val"><span className="s-ico ok">✓</span>{v(cards?.strongest, market ? '%' : ' pts')}</span></div>
      <div className="status yellow"><span className="s-head">{market ? 'Weakest market' : 'Weakest vs peers'} <Info tip={market ? 'Lowest peer median change' : 'Where your deposit change is furthest below the peer median'} /></span><span className="s-val"><span className="s-ico warn">!</span>{v(cards?.weakest, market ? '%' : ' pts')}</span></div>
      <div className="status green"><span className="s-head">Most improved <Info tip={`Change since ${cards?.prevWave || 'the previous wave'}`} /></span><span className="s-val"><span className="s-ico up">↗</span>{noPrev ? 'Needs two waves' : cards?.improved ? v(cards.improved) : 'No improvements'}</span></div>
      <div className="status red"><span className="s-head">Largest decline <Info tip={`Change since ${cards?.prevWave || 'the previous wave'}`} /></span><span className="s-val"><span className="s-ico down">↘</span>{noPrev ? 'Needs two waves' : cards?.declined ? v(cards.declined) : 'No declines'}</span></div>
    </div>
  );
}

export function PulseForm({ p, onDone }) {
  const { toast, refresh } = useApp();
  const [a, setA] = useState(p.myAnswers || {});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setA(x => ({ ...x, [k]: v }));
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    try { await api(`pulses/${p.id}/responses`, { method: 'POST', body: { answers: a } }); toast(p.myAnswers ? 'Answers updated.' : 'Thank you. Results are now unlocked for your institution.'); await refresh(); onDone(); } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  return (
    <form className="form" onSubmit={submit}>
      {p.questions.map((q, n) => (
        <fieldset key={q.id}>
          <legend><span className="qnum">{n + 1}</span>{q.text}</legend>
          {q.type === 'numberByMarket' && <div className="market-grid">{p.markets.map(m => (
            <label key={m}>{m}<span className="num-input"><input type="number" step="0.5" min="-100" max="300" required value={a[q.id]?.[m] ?? ''} onChange={e => set(q.id, { ...(a[q.id] || {}), [m]: e.target.value === '' ? '' : Number(e.target.value) })} /><span>{q.unit}</span></span></label>
          ))}</div>}
          {q.type === 'number' && <label className="market-grid"><span className="num-input"><input type="number" step="0.5" required value={a[q.id] ?? ''} onChange={e => set(q.id, e.target.value === '' ? '' : Number(e.target.value))} aria-label={q.text} /><span>{q.unit}</span></span></label>}
          {q.type === 'single' && <div className="opts">{q.options.map(o => <label key={o} className={`opt ${a[q.id] === o ? 'on' : ''}`}><input type="radio" name={q.id} checked={a[q.id] === o} onChange={() => set(q.id, o)} />{o}</label>)}</div>}
        </fieldset>
      ))}
      <div className="form-actions"><span className="meta">One response per institution. Aggregated results only; groups under {p.minCohort} are hidden. Never used as an input to QS rankings.</span><button className="btn amber" disabled={busy}>{p.myAnswers ? 'Update answers' : 'Submit and see results'}</button></div>
    </form>
  );
}

function CohortPicker({ p, cohort, setCohort }) {
  const { ent } = useApp();
  const [peers, setPeers] = useState([]);
  return (
    <div className="filters">
      <label className="field"><span>Select cohort <Info tip="Compare with all respondents, a region, an institution type, or (Council) a bespoke peer set" /></span>
        <select className="select" value={cohort.kind === 'all' ? 'all' : `${cohort.kind}:${cohort.value || ''}`} onChange={e => { const [k, v] = e.target.value.split(':'); if (k === 'bespoke') return setCohort({ kind: 'bespoke', peers: [] }); setCohort(k === 'all' ? { kind: 'all' } : { kind: k, value: v }); }}>
          <option value="all">All respondents</option>
          <optgroup label={ent.cohortCuts ? 'By region' : 'By region (Member and above)'}>{p.regions.map(r => <option key={r} value={`region:${r}`} disabled={!ent.cohortCuts}>{r}</option>)}</optgroup>
          <optgroup label={ent.cohortCuts ? 'By institution type' : 'By type (Member and above)'}>{p.types.map(r => <option key={r} value={`type:${r}`} disabled={!ent.cohortCuts}>{r}</option>)}</optgroup>
          <option value="bespoke:" disabled={!ent.bespokeCohort}>{ent.bespokeCohort ? 'Bespoke peer cohort…' : 'Bespoke peer cohort (Council)'}</option>
        </select>
      </label>
      {cohort.kind === 'bespoke' && (
        <div className="field" style={{ flex: 1 }}><span>Choose at least {p.minCohort} peers</span>
          <div className="checks">{p.peers.map(x => <label className="check" key={x.id}><input type="checkbox" checked={peers.includes(x.id)} onChange={e => setPeers(e.target.checked ? [...peers, x.id] : peers.filter(y => y !== x.id))} />{x.name}</label>)}</div>
          <div><button className="btn sm amber" disabled={peers.length < p.minCohort} onClick={() => setCohort({ kind: 'bespoke', peers })}>Apply cohort ({peers.length})</button></div>
        </div>
      )}
      {!ent.cohortCuts && <span className="meta">Results by region and institution type are included from Member. <Link to="membership/plans">See plans</Link></span>}
    </div>
  );
}

function Results({ p, r }) {
  const { ent } = useApp();
  if (r.suppressed) return <Empty>Only {r.n} {r.n === 1 ? 'institution' : 'institutions'} in this group. Results are hidden below {p.minCohort} to protect individual institutions.</Empty>;
  const nq = r.questions.find(q => q.type === 'numberByMarket');
  const others = r.questions.filter(q => q.type !== 'numberByMarket');
  const hasMine = nq?.rows.some(x => x.mine != null);
  return (
    <>
      {nq && <>
        {r.cards ? <StatusCards cards={r.cards} /> : r.marketCards && <StatusCards cards={r.marketCards} market />}
        <div style={{ height: 28 }} />
        <div className="panel-head"><div><h3>{hasMine ? 'Your deposits compared to peer median' : 'Peer median by market'} <Info tip={`${nq.text}. n = ${r.n} institutions (${r.demoShare} demo responses).`} /></h3><p>{nq.text} · {r.cohort.label} · n = {r.n}</p></div></div>
        <div className="legend">{hasMine && <span><i style={{ background: 'var(--amber)' }} />Your institution</span>}<span><i style={{ background: 'var(--grey-bar)' }} />Peer median</span></div>
        <GroupedBars unit="%" categories={nq.rows.map(x => x.market)} series={[...(hasMine ? [{ name: 'Your institution', color: '#efa800', values: nq.rows.map(x => x.mine) }] : []), { name: 'Peer median', color: '#a8a8a8', values: nq.rows.map(x => x.median) }]} />
        <div className="scroll"><table className="table"><thead><tr><th>Market</th>{hasMine && <th>You</th>}<th>Peer median</th><th>Middle half of peers</th><th>Median last wave</th></tr></thead><tbody>
          {nq.rows.map(x => <tr key={x.market}><td><strong>{x.market}</strong></td>{hasMine && <td>{signed(x.mine, '%')}</td>}<td>{signed(x.median, '%')}</td><td>{signed(x.p25, '%')} to {signed(x.p75, '%')}</td><td>{signed(x.prevMedian, '%')}</td></tr>)}
        </tbody></table></div>
        <div style={{ height: 24 }} />
      </>}
      <div className="grid g3">
        {others.map(q => (
          <div className="inner" key={q.id}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>{q.text}</h3>
            {q.type === 'number' ? <div className="tiles" style={{ border: 0 }}>
              {q.mine != null && <div className="tile" style={{ minHeight: 110 }}><span className="t-sub">You</span><span className="t-val" style={{ color: 'var(--amber-dark)' }}>{signed(q.mine, q.unit)}</span></div>}
              <div className="tile" style={{ minHeight: 110 }}><span className="t-sub">Peer median</span><span className="t-val">{signed(q.median, q.unit)}</span></div>
            </div> : <HBars options={q.options} mine={q.mine} />}
          </div>
        ))}
      </div>
    </>
  );
}

export function PulseDashboard({ wave }) {
  const { boot, ent } = useApp();
  const waves = boot.pulses.filter(p => p.series === 'recruitment').sort((a, b) => b.closesAt.localeCompare(a.closesAt));
  const id = wave || waves[0]?.id;
  const [p, setP] = useState(null);
  const [cohort, setCohort] = useState({ kind: 'all' });
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const load = (c = cohort) => {
    const qs = c.kind === 'all' ? '' : c.kind === 'bespoke' ? `?cohort=bespoke&peers=${(c.peers || []).join(',')}` : `?cohort=${c.kind}&value=${encodeURIComponent(c.value)}`;
    if (c.kind === 'bespoke' && !(c.peers || []).length) return;
    api(`pulses/${id}${qs}`).then(d => { setP(d); setErr(''); }).catch(e => setErr(e.message));
  };
  useEffect(() => { load(); }, [id]);
  const pick = c => { setCohort(c); load(c); };
  if (!p) return <p className="muted">Loading…</p>;
  return (
    <>
      <PageTitle title="Recruitment Pulse" lede="Live peer operating data between official statistics releases. Institutions answer a short monthly survey; only contributors see how they compare." />
      <Panel title={p.title} action={
        <label className="field" style={{ minWidth: 220 }}><span className="sr-only">Wave</span><select className="select" value={id} onChange={e => { window.location.hash = `/pulse/${e.target.value}`; }}>{waves.map(w => <option key={w.id} value={w.id}>{w.wave}{w.status === 'open' ? ' · open' : ''}</option>)}</select></label>
      }>
        <div className="notice">{p.status === 'open' ? `QS One Recruitment Pulse closes ${fmtNumDate(p.closesAt)}. Next wave: November 2026` : `Closed ${fmtNumDate(p.closesAt)} · ${p.responses} institutions contributed (${p.contributionRate}% of the network)`}</div>
        <div style={{ height: 24 }} />
        {p.locked && ent.kind === 'member' && p.status === 'open' ? (
          <div className="two-col">
            <div className="inner"><h3 style={{ marginTop: 0 }}>Answer to unlock results</h3><PulseForm p={p} onDone={() => load()} /></div>
            <div className="lock-panel"><strong>🔒 {p.responses} institutions have answered</strong><p>{p.locked}</p><p>You will see your deposits against the peer median by market, where you are strongest and weakest, and what changed since last month.</p></div>
          </div>
        ) : p.locked ? <div className="lock-panel"><strong>🔒 {p.locked}</strong>{ent.kind === 'partner' && <Link to="partners">Partner opportunities</Link>}</div> : editing ? (
          <div className="inner"><h3 style={{ marginTop: 0 }}>Update your answers</h3><PulseForm p={p} onDone={() => { setEditing(false); load(); }} /></div>
        ) : (
          <>
            <div className="panel-head" style={{ marginBottom: 6 }}><div /><div className="card-top">{p.contributed && p.status === 'open' && <button className="btn sm ghost" onClick={() => setEditing(true)}>Change my answers</button>}</div></div>
            <CohortPicker p={p} cohort={cohort} setCohort={pick} />
            {err ? <Empty>{err}</Empty> : <Results p={p} r={p.results} />}
          </>
        )}
      </Panel>
      <div className="notice left grey">Pulse data is used only for member benchmarks, never as an input to QS rankings. Responses from fictional demo institutions are included so results display.</div>
    </>
  );
}

export function PulseList() {
  const { boot, ent, me } = useApp();
  const list = [...boot.pulses].sort((a, b) => (a.status === b.status ? b.closesAt.localeCompare(a.closesAt) : a.status === 'open' ? -1 : 1));
  return (
    <>
      <PageTitle title="All Pulse surveys" lede="Short surveys each month, plus benchmarks for different roles. Answering takes a few minutes; results arrive the same day." />
      <Panel title="Surveys" action={null}>
        <div className="tiles">
          {list.map(p => (
            <Link key={p.id} to={p.series === 'recruitment' ? `pulse/${p.id}` : `pulse/s/${p.id}`} className="tile">
              <span className="t-label">{p.title}</span>
              <span className="t-val" style={{ fontSize: 30 }}>{p.status === 'open' ? (p.contributed ? 'Answered' : ent.kind === 'member' ? 'Open' : `${p.responses} in`) : 'Closed'}</span>
              <span className="t-sub">{p.responses} institutions · {p.contributionRate}% · {p.status === 'open' ? `closes ${until(p.closesAt)}` : fmtDate(p.closesAt)}</span>
              {p.forMe && p.status === 'open' && !p.contributed && ent.kind === 'member' && <span><Tag tone="amber">For your role</Tag></span>}
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}

export function PulseSurvey({ id }) {
  const { ent } = useApp();
  const [p, setP] = useState(null);
  const [cohort, setCohort] = useState({ kind: 'all' });
  const load = (c = cohort) => { const qs = c.kind === 'all' ? '' : c.kind === 'bespoke' ? `?cohort=bespoke&peers=${(c.peers || []).join(',')}` : `?cohort=${c.kind}&value=${encodeURIComponent(c.value)}`; if (c.kind === 'bespoke' && !(c.peers || []).length) return; api(`pulses/${id}${qs}`).then(setP); };
  useEffect(() => { load(); }, [id]);
  if (!p) return <p className="muted">Loading…</p>;
  return (
    <>
      <Link to="pulse/all" className="back">← All surveys</Link>
      <PageTitle title={p.title} lede={p.intro} />
      <Panel title={p.status === 'open' ? `Closes ${fmtNumDate(p.closesAt)}` : 'Closed'} action={null}>
        {p.locked && ent.kind === 'member' && p.status === 'open' ? <PulseForm p={p} onDone={() => load()} /> : p.locked ? <div className="lock-panel"><strong>🔒 {p.locked}</strong></div> : <><CohortPicker p={p} cohort={cohort} setCohort={c => { setCohort(c); load(c); }} /><Results p={p} r={p.results} /></>}
      </Panel>
    </>
  );
}
