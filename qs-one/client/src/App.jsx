import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getUser, setUser } from './api.js';
import { AppCtx, Avatar } from './ui.jsx';
import Home from './pages/Home.jsx';
import Intelligence, { Briefing } from './pages/Intelligence.jsx';
import DomainHub from './pages/DomainHub.jsx';
import Exchange from './pages/Exchange.jsx';
import Pulse, { PulseDetail } from './pages/Pulse.jsx';
import Circles, { CircleDetail } from './pages/Circles.jsx';
import Network from './pages/Network.jsx';
import Convene from './pages/Convene.jsx';
import PartnerHub from './pages/PartnerHub.jsx';
import Profile, { Institution } from './pages/Profile.jsx';
import Membership from './pages/Membership.jsx';
import Sources, { Admin } from './pages/Sources.jsx';

const NAV = [
  { group: 'Workspace', items: [['', 'Home', '⌂'], ['intelligence', 'Intelligence', '▤'], ['domain/mobility', 'Mobility hub', '⇄']] },
  { group: 'Community', items: [['exchange', 'Exchange', '❝'], ['pulse', 'Pulse', '◔'], ['circles', 'Circles', '◎'], ['network', 'Network', '⌘']] },
  { group: 'Meet & partner', items: [['convene', 'Convene', '▦'], ['partners', 'Partner Hub', '⬡']] },
  { group: 'Account', items: [['profile', 'My profile', '◉'], ['membership', 'Membership', '★'], ['sources', 'QS data sources', '⟳']] }
];

function useHash() {
  const read = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [hash, setHash] = useState(read);
  useEffect(() => {
    const on = () => { setHash(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [boot, setBoot] = useState(null);
  const [error, setError] = useState('');
  const [toastMsg, setToast] = useState(null);
  const [menu, setMenu] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try { setBoot(await api('bootstrap')); setError(''); setVersion(v => v + 1); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setMenu(false); }, [hash]);

  const toast = useCallback((msg, bad = false) => {
    setToast({ msg, bad, key: Date.now() });
    clearTimeout(toast.t); toast.t = setTimeout(() => setToast(null), 4800);
  }, []);

  const ctx = useMemo(() => boot && ({ boot, refresh, toast, me: boot.me, ent: boot.entitlements, version, go: p => { window.location.hash = '/' + p; } }), [boot, refresh, toast, version]);

  if (error && !boot) return <div className="boot-error"><h1>QS One could not load</h1><p>{error}</p><p>Check the server is running (press Run in Replit), then reload.</p></div>;
  if (!boot) return <div className="boot-loading"><span className="brand-mark">QS<b>One</b></span><p>Loading your workspace…</p></div>;

  const [section, sub, sub2] = hash.split('/');
  let page;
  switch (section) {
    case '': case undefined: page = <Home />; break;
    case 'intelligence': page = sub ? <Briefing id={sub} /> : <Intelligence />; break;
    case 'domain': page = <DomainHub id={sub || 'mobility'} key={sub} />; break;
    case 'exchange': page = <Exchange />; break;
    case 'pulse': page = sub ? <PulseDetail id={sub} key={sub} /> : <Pulse />; break;
    case 'circles': page = sub ? <CircleDetail id={sub} key={sub} /> : <Circles />; break;
    case 'network': page = <Network tab={sub} />; break;
    case 'convene': page = <Convene eventId={sub} />; break;
    case 'partners': page = <PartnerHub tab={sub} />; break;
    case 'profile': page = <Profile />; break;
    case 'institution': page = <Institution id={sub} key={sub} />; break;
    case 'membership': page = <Membership />; break;
    case 'sources': page = <Sources />; break;
    case 'admin': page = <Admin />; break;
    default: page = <Home />;
  }
  const active = p => (p === '' ? section === '' || section === undefined : hash === p || (p.split('/')[0] === section && !p.includes('/')) || hash.startsWith(p + '/'));
  const pendingIntros = boot.intros.filter(n => n.toId === boot.me.id && n.status === 'requested').length;
  const openPulses = boot.pulses.filter(p => !p.contributed).length;
  const badge = p => (p === 'network' && pendingIntros ? pendingIntros : p === 'pulse' && boot.entitlements.kind === 'member' && openPulses ? openPulses : null);

  return (
    <AppCtx.Provider value={ctx}>
      <div className={`shell ${menu ? 'menu-open' : ''}`}>
        <aside className="sidebar">
          <div className="brand">
            <a href="#/" className="brand-mark" aria-label="QS One home">QS<b>One</b></a>
            <button className="menu-btn" onClick={() => setMenu(m => !m)} aria-label="Toggle navigation" aria-expanded={menu}>☰</button>
          </div>
          <nav aria-label="Main">
            {NAV.map(g => (
              <div className="nav-group" key={g.group}>
                <div className="nav-label">{g.group}</div>
                {g.items.map(([p, label, icon]) => (
                  <a key={p} href={`#/${p}`} className={active(p) ? 'active' : ''}>
                    <span className="glyph" aria-hidden="true">{icon}</span>{label}
                    {badge(p) ? <span className="nav-badge">{badge(p)}</span> : null}
                  </a>
                ))}
              </div>
            ))}
            {boot.entitlements.kind === 'staff' && <div className="nav-group"><div className="nav-label">QS team</div><a href="#/admin" className={section === 'admin' ? 'active' : ''}><span className="glyph">⚑</span>Team console</a></div>}
          </nav>
          <a className="side-me" href="#/profile">
            <Avatar name={boot.me.name} kind={boot.me.orgType} />
            <span><strong>{boot.me.name}</strong><em>{boot.org?.name}</em></span>
          </a>
        </aside>
        <main className="main">
          <header className="topbar">
            <span className="demo-pill" title="No sign-in. Anyone with the link can see and change demo data.">Proof of concept · demo data</span>
            <div className="top-right">
              <label className="switcher"><span>View as</span>
                <select value={getUser()} onChange={e => { setUser(e.target.value); refresh(); window.location.hash = '/'; }} aria-label="Switch demo persona">
                  {boot.personas.map(p => <option key={p.id} value={p.id}>{p.name} · {p.orgName} ({p.label})</option>)}
                </select>
              </label>
              <a href="#/membership" className={`tier-pill ${boot.entitlements.kind}`}>{boot.entitlements.label}</a>
            </div>
          </header>
          <div className="content" key={boot.me.id}>{page}</div>
          <footer className="app-foot">
            <span>QS One · proof of concept. All institutions, people and partners are fictional. QS source content links to qs.com and shows when it was read.</span>
            <a href="#/membership">Independence Charter</a>
          </footer>
        </main>
      </div>
      <div aria-live="polite" className="toast-zone">{toastMsg && <div key={toastMsg.key} className={`toast ${toastMsg.bad ? 'bad' : ''}`}>{toastMsg.msg}</div>}</div>
    </AppCtx.Provider>
  );
}
