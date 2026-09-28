import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getUser, setUser } from './api.js';
import { AppCtx, until, initials } from './ui.jsx';
import Overview from './pages/Overview.jsx';
import { Intelligence, Briefing, Webinars, Library, Sources } from './pages/Intelligence.jsx';
import { Communities, CommunityDetail } from './pages/Communities.jsx';
import { PulseDashboard, PulseList, PulseSurvey } from './pages/Pulse.jsx';
import { Directory, Intros, Summits, Board } from './pages/Connect.jsx';
import { Membership, Plans, Institution, Profile } from './pages/Membership.jsx';
import { Partners, Help, Admin } from './pages/Other.jsx';

const Icon = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  intel: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>,
  comm: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 20c0-2.5 1.5-4.5 4-4.5s3.5 1.5 3.5 4" /></svg>,
  pulse: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="11" width="4" height="10" rx="1" /><rect x="10" y="6" width="4" height="15" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></svg>,
  connect: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8.7 10.6l6.6-3.2M8.7 13.4l6.6 3.2" /></svg>,
  member: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2.5" /><path d="M5.5 17c.8-1.8 2-2.6 3.5-2.6s2.7.8 3.5 2.6M14 10h4M14 14h4" /></svg>,
  partner: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>,
  help: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></svg>,
  team: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21V4h11l-1.5 4L15 12H4" /></svg>,
  chev: <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 15l6-6 6 6" /></svg>
};

function useHash() {
  const read = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [hash, setHash] = useState(read);
  useEffect(() => { const on = () => { setHash(read()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  return hash;
}

function Carousel({ boot, section }) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const pending = boot.intros.filter(n => n.toId === boot.me.id && n.status === 'requested').length;
  const recPulse = boot.pulses.find(p => p.series === 'recruitment' && p.status === 'open');
  const myComms = boot.communities.filter(c => c.isMember);
  const nextSession = myComms.map(c => c.next).filter(Boolean).sort((a, b) => a.at.localeCompare(b.at))[0];
  const nextSummit = boot.events.filter(e => !e.past).sort((a, b) => a.start.localeCompare(b.start))[0];
  const ent = boot.entitlements;
  const cards = [
    { id: 'pulse', to: 'pulse', big: recPulse ? recPulse.wave.split(' ')[0] : 'Pulse', isNew: recPulse && !recPulse.contributed && ent.kind === 'member', lbl: 'Recruitment Pulse', info: 'Monthly peer benchmark. Only contributors see results.' },
    { id: 'intelligence', to: 'intelligence', big: '3 new', lbl: 'Signals & briefings', info: 'Weekly Signal and monthly domain briefings' },
    { id: 'communities', to: 'communities', big: myComms.length ? `${myComms.length} joined` : 'Open sessions', lbl: nextSession ? `Next session ${until(nextSession.at)}` : 'Communities', info: 'Standing communities with a QS facilitator' },
    { id: 'connect', to: pending ? 'connect/intros' : 'connect', big: pending ? `${pending} request${pending > 1 ? 's' : ''}` : `${boot.people.filter(p => p.orgType === 'institution').length} leaders`, isNew: pending > 0, lbl: 'Connect', info: 'Verified leaders and consent-based introductions' },
    { id: 'summits', to: `connect/summits/${nextSummit?.id || ''}`, big: nextSummit ? nextSummit.short : 'Summits', lbl: nextSummit ? `QS summit ${until(nextSummit.start)}` : 'QS summits', info: 'Summit matching and passes' },
    { id: 'membership', to: 'membership', big: ent.kind === 'member' ? ent.label : ent.label, lbl: ent.kind === 'member' ? `${boot.onboarding.done}/${boot.onboarding.total} set-up steps done` : 'Membership', info: 'Your plan, onboarding and benefits' }
  ];
  const onScroll = () => { const t = track.current; if (!t) return; setEdge({ start: t.scrollLeft < 8, end: t.scrollLeft + t.clientWidth > t.scrollWidth - 8 }); };
  useEffect(onScroll, []);
  const move = d => track.current?.scrollBy({ left: d * 400, behavior: 'smooth' });
  const sel = section === 'connect' && window.location.hash.includes('summits') ? 'summits' : section;
  return (
    <div className="carousel">
      <button className="car-btn" onClick={() => move(-1)} disabled={edge.start} aria-label="Previous"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M15 5l-7 7 7 7" /></svg></button>
      <div className="car-track" ref={track} onScroll={onScroll}>
        {cards.map(c => (
          <a key={c.id} href={`#/${c.to}`} className={`sum-card ${sel === c.id ? 'sel' : ''}`}>
            <span className="big">{c.big}{c.isNew && <span className="new-badge">NEW</span>}</span>
            <span className="lbl">{c.lbl} <i className="info-dot" title={c.info}>i</i></span>
          </a>
        ))}
      </div>
      <button className="car-btn dark" onClick={() => move(1)} disabled={edge.end} aria-label="Next"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M9 5l7 7-7 7" /></svg></button>
    </div>
  );
}

export default function App() {
  const hash = useHash();
  const [boot, setBoot] = useState(null);
  const [error, setError] = useState('');
  const [toastMsg, setToast] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState({ intelligence: true, communities: true, pulse: true, connect: true, membership: false });

  const refresh = useCallback(async () => { try { setBoot(await api('bootstrap')); setError(''); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setMobileOpen(false); }, [hash]);
  const toast = useCallback((msg, bad = false) => { setToast({ msg, bad, key: Date.now() }); clearTimeout(toast.t); toast.t = setTimeout(() => setToast(null), 5000); }, []);
  const ctx = useMemo(() => boot && ({ boot, refresh, toast, me: boot.me, ent: boot.entitlements }), [boot, refresh, toast]);

  if (error && !boot) return <div className="boot"><span className="logo">QS</span><h1>QS One could not load</h1><p>{error}</p><p>Check the server is running (press Run in Replit), then reload.</p></div>;
  if (!boot) return <div className="boot"><span className="logo">QS</span><p>Loading QS One…</p></div>;

  const [section, sub, sub2] = hash.split('/');
  let page;
  switch (section) {
    case '': case undefined: page = <Overview />; break;
    case 'intelligence': page = sub === 'webinars' ? <Webinars /> : sub === 'library' ? <Library /> : sub === 'sources' ? <Sources /> : sub ? <Briefing id={sub} key={sub} /> : <Intelligence />; break;
    case 'communities': page = sub && !['all', 'open'].includes(sub) ? <CommunityDetail id={sub} key={sub} /> : <Communities tab={sub || 'mine'} />; break;
    case 'pulse': page = sub === 'all' ? <PulseList /> : sub === 's' ? <PulseSurvey id={sub2} key={sub2} /> : <PulseDashboard wave={sub} key={sub || 'x'} />; break;
    case 'connect': page = sub === 'intros' ? <Intros /> : sub === 'summits' ? <Summits eventId={sub2} key={sub2 || 's'} /> : sub === 'board' ? <Board /> : <Directory />; break;
    case 'membership': page = sub === 'plans' ? <Plans /> : <Membership />; break;
    case 'institution': page = <Institution id={sub} key={sub} />; break;
    case 'profile': page = <Profile />; break;
    case 'partners': page = <Partners />; break;
    case 'help': page = <Help />; break;
    case 'admin': page = <Admin />; break;
    default: page = <Overview />;
  }
  const pending = boot.intros.filter(n => n.toId === boot.me.id && n.status === 'requested').length;
  const openPulses = boot.pulses.filter(p => p.status === 'open' && !p.contributed).length;
  const NAV = [
    { id: 'intelligence', label: 'Intelligence', icon: Icon.intel, items: [['intelligence', 'Signals & briefings'], ['intelligence/webinars', 'Expert webinars'], ['intelligence/library', 'Case studies & frameworks'], ['intelligence/sources', 'QS data sources']] },
    { id: 'communities', label: 'Communities', icon: Icon.comm, items: [['communities', 'My communities'], ['communities/all', 'All communities'], ['communities/open', 'Open sessions']] },
    { id: 'pulse', label: 'Pulse', icon: Icon.pulse, items: [['pulse', 'Recruitment Pulse'], ['pulse/all', 'All surveys', boot.entitlements.kind === 'member' ? openPulses : 0]] },
    { id: 'connect', label: 'Connect', icon: Icon.connect, items: [['connect', 'Directory'], ['connect/intros', 'Introductions', pending], ['connect/summits', 'Summits'], ['connect/board', 'Partner board']] },
    { id: 'membership', label: 'Membership', icon: Icon.member, items: [['membership', 'Our membership'], ['membership/plans', 'Plans & benefits'], ...(boot.me.orgType === 'institution' ? [[`institution/${boot.me.orgId}`, 'Institution profile']] : []), ['profile', 'My profile']] }
  ];
  const isActive = p => hash === p || (p === 'communities' && section === 'communities' && sub && !['all', 'open'].includes(sub)) || (p === 'connect/summits' && hash.startsWith('connect/summits')) || (p === 'intelligence' && section === 'intelligence' && sub && !['webinars', 'library', 'sources'].includes(sub)) || (p === 'pulse' && section === 'pulse' && sub && !['all', 's'].includes(sub));
  const orgCount = boot.org?.memberCount ?? boot.institutions.find(i => i.id === boot.me.orgId)?.memberCount;

  return (
    <AppCtx.Provider value={ctx}>
      <header className="topbar">
        <button className="collapse-btn" onClick={() => (window.innerWidth <= 900 ? setMobileOpen(o => !o) : setCollapsed(c => !c))} aria-label="Toggle navigation">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 10l-2 2 2 2" /></svg>
        </button>
        <a href="#/" className="logo" aria-label="QS One home">QS</a>
        <span className="product">QS One</span>
        <span className="org-name">{boot.org?.name}</span>
        <div className="top-right">
          <span className="demo-note" title="No sign-in. Anyone with the link can switch people and change demo data.">Demo data</span>
          <button className="btn-outline share" onClick={() => toast('Sharing is not available in the demo.')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6" /></svg>Share
          </button>
          <label className="org-select"><span className="sr-only">View as</span>
            <select value={getUser()} onChange={e => { setUser(e.target.value); window.location.hash = '/'; refresh(); }}>
              {boot.personas.map(p => <option key={p.id} value={p.id}>{p.orgName} · {p.name} ({p.label})</option>)}
            </select>
          </label>
          <a className="icon-circle help" href="#/help" aria-label="Help">{Icon.help}</a>
          <span className="icon-circle grid-ico" title="MyQS apps"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg></span>
          <a className="avatar-top" href="#/profile" title={boot.me.name}>{initials(boot.me.name)}</a>
        </div>
      </header>
      <div className={`shell ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <aside className="sidenav" aria-label="Main navigation">
          <a href="#/" className={`nav-head ${!section ? 'open' : ''}`}><span className="nav-ico">{Icon.home}</span>Overview</a>
          {NAV.map(g => (
            <div className="nav-sec" key={g.id}>
              <button className={`nav-head ${open[g.id] ? 'open' : ''}`} onClick={() => setOpen(o => ({ ...o, [g.id]: !o[g.id] }))} aria-expanded={!!open[g.id]}>
                <span className="nav-ico">{g.icon}</span>{g.label}{Icon.chev}
              </button>
              {open[g.id] && <div className="nav-items">{g.items.map(([p, l, n]) => <a key={p} href={`#/${p}`} className={isActive(p) ? 'active' : ''}>{l}{n ? <span className="nav-badge">{n}</span> : null}</a>)}</div>}
            </div>
          ))}
          <div className="nav-divider" />
          <a href="#/partners" className={`nav-head ${section === 'partners' ? 'open' : ''}`}><span className="nav-ico">{Icon.partner}</span>Partner opportunities</a>
          {boot.entitlements.kind === 'staff' && <a href="#/admin" className={`nav-head ${section === 'admin' ? 'open' : ''}`}><span className="nav-ico">{Icon.team}</span>Team view</a>}
          <a href="#/help" className={`nav-head ${section === 'help' ? 'open' : ''}`}><span className="nav-ico">{Icon.help}</span>Help</a>
        </aside>
        <main className="main">
          <div className="content" key={boot.me.id}>
            <Carousel boot={boot} section={section || 'overview'} />
            {page}
            <footer className="app-foot"><span>QS One · proof of concept. All institutions, people and partners are fictional. QS content links to qs.com and shows when it was read.</span><a href="#/membership/plans">Plans & benefits</a></footer>
          </div>
        </main>
      </div>
      <div aria-live="polite" className="toast-zone">{toastMsg && <div key={toastMsg.key} className={`toast ${toastMsg.bad ? 'bad' : ''}`}>{toastMsg.msg}</div>}</div>
    </AppCtx.Provider>
  );
}
