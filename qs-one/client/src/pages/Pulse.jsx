import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp, PageHead, Link, Bars, Note, Empty, Tag, fmtDate, until, DomainTags } from '../ui.jsx';

export default function Pulse() {
  const { boot, ent } = useApp();
  return (
    <>
      <PageHead eyebrow="Give to get" title="Pulse benchmarks" intro="Short operational questions answered once per institution. Your institution sees aggregated results after it contributes. Results are hidden when fewer than five institutions are in a group." />
      {ent.kind === 'partner' && <Note>Pulse results are only for contributing member institutions. Partners see aggregated priorities in the <Link to="partners/insights">Partner Hub</Link>.</Note>}
      <div className="grid three">
        {boot.pulses.map(p => (
          <Link key={p.id} to={`pulse/${p.id}`} className="card link-card pulse-card">
            <div className="card-kicker"><DomainTags ids={[p.domain]} /> closes {until(p.closesAt)}</div>
            <strong>{p.title}</strong>
            <div className="pulse-meter"><span style={{ width: `${Math.min(100, p.responses * 8)}%` }} /></div>
            <span className="meta">{p.responses} institutions answered</span>
            {ent.kind === 'member' && (p.contributed ? <Tag tone="teal">Contributed · results unlocked</Tag> : <Tag tone="pink">Contribute to unlock</Tag>)}
          </Link>
        ))}
      </div>
      <Note>Pulse data is used only for member benchmarks. It is never an input to QS rankings (Independence Charter, rule 2). Responses from fictional demo institutions are included so results display.</Note>
    </>
  );
}

export function PulseDetail({ id }) {
  const { ent, toast, refresh, boot } = useApp();
  const [p, setP] = useState(null);
  const [answers, setAnswers] = useState({});
  const [filter, setFilter] = useState({ region: '', type: '' });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = (f = filter) => api(`pulses/${id}?region=${encodeURIComponent(f.region)}&type=${encodeURIComponent(f.type)}`).then(d => { setP(d); if (d.myAnswers) setAnswers(d.myAnswers); });
  useEffect(() => { load(); }, [id]);
  if (!p) return <p className="muted">Loading…</p>;

  const setA = (q, v) => setAnswers(a => ({ ...a, [q.id]: v }));
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    try { await api(`pulses/${id}/responses`, { method: 'POST', body: { answers } }); toast(p.contributed ? 'Your answers were updated.' : 'Thank you. Results are now unlocked for your institution.'); setEditing(false); await load(); refresh(); } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  const changeFilter = f => { setFilter(f); load(f); };
  const showForm = ent.kind === 'member' && (!p.contributed || editing);

  return (
    <>
      <Link to="pulse">← Pulse</Link>
      <PageHead eyebrow={`Pulse · closes ${fmtDate(p.closesAt)}`} title={p.title} intro={p.intro} />
      {showForm ? (
        <form className="card pulse-form" onSubmit={submit}>
          {p.questions.map((q, n) => (
            <fieldset key={q.id} className="pulse-q">
              <legend><span className="qn">{n + 1}</span>{q.text}</legend>
              <div className={`opts ${q.options.length > 6 ? 'many' : ''}`}>
                {q.options.map(o => {
                  const multi = q.type === 'multi';
                  const cur = answers[q.id];
                  const checked = multi ? (cur || []).includes(o) : cur === o;
                  return (
                    <label key={o} className={`opt ${checked ? 'on' : ''}`}>
                      <input type={multi ? 'checkbox' : 'radio'} name={q.id} checked={checked}
                        onChange={e => multi ? setA(q, e.target.checked ? [...(cur || []), o].slice(-(q.max || 99)) : (cur || []).filter(x => x !== o)) : setA(q, o)} />
                      {o}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="form-actions"><span className="meta">One response per institution. You can change it until the Pulse closes.</span>{editing && <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>}<button className="btn primary" disabled={busy}>{p.contributed ? 'Update answers' : 'Submit and see results'}</button></div>
        </form>
      ) : p.locked ? <Empty>{p.locked}</Empty> : null}

      {p.results && (
        <section className="section">
          <div className="section-head">
            <div><h2>Results</h2><p>{p.results.suppressed ? `Only ${p.results.n} institutions in this group. Results are hidden below ${p.minCohort} to protect individual institutions.` : `n = ${p.results.n} institutions${p.filter ? ' in this cohort' : ''} · ${p.results.demoShare} are demo responses`}</p></div>
            {ent.kind === 'member' && p.contributed && !editing && <button className="btn small ghost" onClick={() => setEditing(true)}>Change my answers</button>}
          </div>
          <div className="filters">
            <select id="pulse-region" value={filter.region} onChange={e => changeFilter({ ...filter, region: e.target.value })} disabled={!ent.cohortCuts} aria-label="Region cohort"><option value="">All regions</option>{p.regions.map(r => <option key={r}>{r}</option>)}</select>
            <select id="pulse-type" value={filter.type} onChange={e => changeFilter({ ...filter, type: e.target.value })} disabled={!ent.cohortCuts} aria-label="Institution type cohort"><option value="">All institution types</option>{p.types.map(r => <option key={r}>{r}</option>)}</select>
            {!ent.cohortCuts && <span className="meta">Cohort cuts are included from Leadership membership. <Link to="membership">Compare →</Link></span>}
          </div>
          {p.results.suppressed ? <Empty>Not enough responses in this group to show results safely.</Empty> : (
            <div className="grid two">
              {p.results.questions.map(q => (
                <div className="card" key={q.id}>
                  <h3 className="small">{q.text}</h3>
                  <Bars options={q.type === 'multi' ? [...q.options].sort((a, b) => b.pct - a.pct).slice(0, 6) : q.options} highlight={[].concat(p.myAnswers?.[q.id] || [])} />
                  {q.type === 'multi' && <span className="meta">Share of institutions choosing each market. Top six shown.</span>}
                </div>
              ))}
            </div>
          )}
          <Note>Want the story behind these numbers? Discuss them in the <Link to="circles/c1">Recruitment risk & compliance Circle</Link>, or compare with <Link to="domain/mobility">QS Global Student Flows</Link>.</Note>
        </section>
      )}
    </>
  );
}
