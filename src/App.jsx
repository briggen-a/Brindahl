import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint, Globe, Heart, List, Martini, Planet } from '@phosphor-icons/react';
import { people, routeFromHash } from './content.js';
import { Artwork, BottomNav, DossierNavigation, GuestbookLink, HouseHeader, Modal, Panel, navigation } from './components.jsx';

function Landing({ onMenu, onPlanetTap }) {
  return <>
    <header className="landing-header">
      <button className="icon-button menu-trigger" type="button" onClick={onMenu} aria-label="Open archive menu"><List weight="thin" size={32} /></button>
      <p className="eyebrow">The imperial dynasty of</p>
      <h1 tabIndex={-1}>Brindahl</h1>
      <p className="tagline">Dance <span>•</span> Travel <span>•</span> Avoid invasion</p>
    </header>
    <div className="landing-scene">
      <Artwork asset="hero" className="hero-artwork" priority />
      <button className="planet-target art-link" type="button" onClick={onPlanetTap} aria-label="Explore planet Brindahl"><span className="art-link__hint">Explore Brindahl</span></button>
      {['duke', 'duchess'].map(person => <a className={`standing-character standing-character--${person} art-link`} key={person} href={`#/${person}`} aria-label={`Open ${people[person].title} ${people[person].name} dossier`}>
        <span className="art-link__hint">Open {people[person].title} dossier</span>
      </a>)}
    </div>
    <GuestbookLink /><BottomNav page="home" />
    <p className="hero-subline">Two worlds. One dynasty.<br />An extremely consequential dance.</p>
  </>;
}

function Dossier({ page }) {
  const person = people[page];
  return <>
    <HouseHeader />
    <article className={`dossier dossier--${page}`} aria-labelledby="person-name">
      <Artwork asset={`${page}Portrait`} className="dossier-portrait" priority />
      <div className="dossier-summary">
        <div className="dossier-title bevel"><h1 id="person-name" tabIndex={-1}><span>{person.title}</span>{person.name}</h1><p className="classification">{person.classification}</p></div>
        <dl className="person-facts"><div><dt>Origin</dt><dd>{person.origin}<span>({person.originDetail})</span></dd></div><div><dt>Role</dt><dd>{person.role}</dd></div></dl>
      </div>
      <Panel title="Biography" className="biography"><p>{person.biography}</p></Panel>
      {page === 'duke' ? <Panel title="Notable exploits" className="person-extras"><ul className="exploits">{person.exploits.map(exploit => <li key={exploit}>{exploit}</li>)}</ul></Panel> :
        <Panel title="At a glance" className="person-extras"><ul className="at-a-glance">{[[Globe, 'Dance enthusiast'], [Planet, 'Galactic traveler'], [Martini, 'Beverage connoisseur'], [Heart, 'Keeps the Duke in line']].map(([Icon, label]) => <li key={label}><Icon weight="thin" size={30} aria-hidden="true" /><span>{label}</span></li>)}</ul></Panel>}
      {person.quote && <blockquote>“{person.quote}”<cite>— Duchess Lhadnik</cite></blockquote>}
      <Artwork asset={page === 'duke' ? 'bishop' : 'avelis'} className="dossier-landscape" />
    </article>
    <DossierNavigation page={page} />
  </>;
}

function Guestbook() {
  return <><HouseHeader /><section className="utility-page">
    <p className="eyebrow">The imperial archives</p><h1 tabIndex={-1}>The imperial<br />visitor registry</h1>
    <p className="page-intro">A permanent record of those who survived first contact.</p>
    <Panel title="Registry awaiting authorization"><p>The visitor registry is not yet open.</p><p>Guest messages and optional photographs will be published only after review. No personal information is being collected.</p></Panel>
  </section><BottomNav page="guestbook" /></>;
}

function Secrets({ onReveal }) {
  const [scanned, setScanned] = useState(false);
  return <><HouseHeader /><section className="utility-page secrets-page">
    <p className="eyebrow">Classified imperial archive</p><h1 tabIndex={-1}>Secrets</h1>
    <Panel title="Bishop temporal anomaly"><p className="archive-year">4876</p><p>A geriatric dance party. Two future royals. One exceptionally consequential invitation.</p><button className="text-button" type="button" onClick={onReveal}>Open the Bishop record</button></Panel>
    <Panel title="Imperial identity scan"><button className="scanner" type="button" onClick={() => setScanned(true)} aria-label="Run fictional imperial identity scan"><Fingerprint weight="thin" size={64} aria-hidden="true" /><span>{scanned ? 'Scan complete' : 'Begin scan'}</span></button><p role="status" className="scan-result">{scanned ? 'Identity: honored visitor. Dance credentials: unverified.' : 'A theatrical scan. No biometric data is collected.'}</p></Panel>
  </section><BottomNav page="secrets" /></>;
}

export default function App() {
  const [page, setPage] = useState(() => routeFromHash(window.location.hash));
  const [modal, setModal] = useState(null);
  const taps = useRef(0);
  const firstRender = useRef(true);
  const main = useRef(null);
  useEffect(() => {
    const onHashChange = () => { setPage(routeFromHash(window.location.hash)); setModal(null); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    const title = people[page] ? `${people[page].title} ${people[page].name}` : page === 'home' ? 'Brindahl' : page === 'guestbook' ? 'The imperial visitor registry' : 'Secrets';
    document.title = `${title} — Imperial Archives`;
    taps.current = 0;
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.current?.querySelector('h1')?.focus({ preventScroll: true });
  }, [page]);
  function tapPlanet() {
    taps.current += 1;
    if (taps.current === 5) { taps.current = 0; setModal('bishop'); }
  }
  return <>
    <a href="#archive-content" className="skip-link" onClick={event => { event.preventDefault(); main.current?.querySelector('h1')?.focus(); }}>Skip to content</a>
    <main id="archive-content" ref={main} className={`archive-shell archive-shell--${page}`}>
      {page === 'home' ? <Landing onMenu={() => setModal('menu')} onPlanetTap={tapPlanet} /> : people[page] ? <Dossier page={page} /> : page === 'guestbook' ? <Guestbook /> : <Secrets onReveal={() => setModal('bishop')} />}
    </main>
    {modal === 'menu' && <Modal title="Imperial archives" onClose={() => setModal(null)}><nav className="menu-nav" aria-label="Archive menu">{navigation.map(({ route, label, Icon }) => <a key={route} href={`#/${route}`} onClick={() => setModal(null)}><Icon size={26} weight="thin" aria-hidden="true" />{label}</a>)}</nav></Modal>}
    {modal === 'bishop' && <Modal title="The Bishop encounter" onClose={() => setModal(null)}><p className="eyebrow">Temporal anomaly · 4876</p><p>At a geriatric dance party on Bishop, Duchess Lhadnik found Duke Mahgirb apparently studying the emergency exits. She invited him to dance.</p><p>The Duke insists he was only there for the refreshments.</p><a className="text-button" href="#/duchess" onClick={() => setModal(null)}>Read the Duchess’s account</a><button className="text-button" type="button" onClick={() => setModal(null)}>Reseal the archive</button></Modal>}
  </>;
}
