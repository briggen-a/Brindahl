import Guestbook from './Guestbook.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight, Fingerprint, Globe, Heart, Martini, Planet } from '@phosphor-icons/react';
import { people, routeFromHash } from './content.js';
import { Artwork, BottomNav, DossierNavigation, GuestbookLink, HouseHeader, Modal, Panel } from './components.jsx';

function Landing({ onPlanetTap }) {
  return <>
    <header className="landing-header">
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
  </>;
}

function Dossier({ page }) {
  const person = people[page];
  return <>
    <HouseHeader dossier />
    <a href="#/home" className="dossier-back" aria-label="Back to Brindahl">
      {page === 'duke' ? <CaretRight aria-hidden="true" /> : <CaretLeft aria-hidden="true" />}
      Back
    </a>
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
  const previousPage = useRef(page);
  const keyboardActivation = useRef(false);
  const [outgoing, setOutgoing] = useState(null);
  const firstRender = useRef(true);
  const main = useRef(null);
  useEffect(() => {
    function onHashChange(event) {
      const from = routeFromHash(new URL(event.oldURL).hash);
      const to = routeFromHash(window.location.hash);
      const order = ['duke', 'home', 'duchess'];
      const sliding = from !== to && order.includes(from) && order.includes(to)
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = document.documentElement;
      if (from === 'home') {
        const scene = main.current?.querySelector('.landing-scene')?.getBoundingClientRect();
        if (scene) root.style.setProperty('--return-height', (scene.top + scene.height * .48) + 'px');
      }
      previousPage.current = from;
      root.dataset.slide = sliding ? (order.indexOf(to) < order.indexOf(from) ? 'left' : 'right') : '';
      setOutgoing(sliding ? { page: from, scroll: window.scrollY } : null);
      setPage(to);
      setModal(null);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    const title = people[page] ? `${people[page].title} ${people[page].name}` : page === 'home' ? 'Brindahl' : page === 'guestbook' ? 'The imperial visitor registry' : 'Secrets';
    document.title = `${title} — Imperial Archives`;
    taps.current = 0;
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    const returnLink = keyboardActivation.current && page === 'home' && people[previousPage.current]
      ? main.current?.querySelector('.standing-character--' + previousPage.current) : null;
    (returnLink || main.current?.querySelector('h1'))?.focus({ preventScroll: true });
  }, [page]);
  useEffect(() => {
    if (!outgoing) return;
    const timer = window.setTimeout(() => setOutgoing(null), 390);
    return () => window.clearTimeout(timer);
  }, [outgoing]);
  function tapPlanet() {
    taps.current += 1;
    if (taps.current === 5) { taps.current = 0; setModal('bishop'); }
  }
  return <>
    <a href="#archive-content" className="skip-link" onClick={event => { event.preventDefault(); main.current?.querySelector('h1')?.focus(); }}>Skip to content</a>
    {outgoing && <div className="outgoing-screen" inert aria-hidden="true">
      <div style={{ transform: 'translateY(-' + outgoing.scroll + 'px)' }}>
        <div className={'archive-shell archive-shell--' + outgoing.page}>
          {outgoing.page === 'home' ? <Landing /> : <Dossier page={outgoing.page} />}
        </div>
      </div>
    </div>}
    <main key={page} id="archive-content" ref={main}
      onClickCapture={event => {
        // Keyboard and assistive activations have a zero click count.
        keyboardActivation.current = event.detail === 0;
      }}
      className={`archive-shell archive-shell--${page}${outgoing ? ' incoming-screen' : ''}`}>
      {page === 'home' ? <Landing onPlanetTap={tapPlanet} /> : people[page] ? <Dossier page={page} /> : page === 'guestbook' ? <Guestbook /> : <Secrets onReveal={() => setModal('bishop')} />}
    </main>
    {modal === 'bishop' && <Modal title="The Bishop encounter" onClose={() => setModal(null)}><p className="eyebrow">Temporal anomaly · 4876</p><p>At a geriatric dance party on Bishop, Duchess Lhadnik found Duke Mahgirb apparently studying the emergency exits. She invited him to dance.</p><p>The Duke insists he was only there for the refreshments.</p><a className="text-button" href="#/duchess" onClick={() => setModal(null)}>Read the Duchess’s account</a><button className="text-button" type="button" onClick={() => setModal(null)}>Reseal the archive</button></Modal>}
  </>;
}
