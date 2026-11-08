import React, { useEffect, useRef } from 'react';
import { BookOpen, CaretLeft, CaretRight, Cube, Planet, StarFour, UsersThree, X } from '@phosphor-icons/react';
import { artwork, guestbookSubtitle } from './content.js';

export const navigation = [
  { route: 'home', label: 'Brindahl', Icon: Planet },
  { route: 'duke', label: 'The House', Icon: StarFour },
  { route: 'guestbook', label: 'Guestbook', Icon: UsersThree },
  { route: 'secrets', label: 'Secrets', Icon: Cube },
];

export function Artwork({ asset, className = '', priority = false }) {
  const item = artwork[asset];
  return <img className={`artwork ${className}`} src={item.src} alt={item.alt}
    width={item.width} height={item.height} decoding="async"
    loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} />;
}

export function BottomNav({ page }) {
  return <nav className="bottom-nav" aria-label="Imperial archives">
    {navigation.map(({ route, label, Icon }) => <a key={route} href={`#/${route}`} aria-current={page === route || (route === 'duke' && page === 'duchess') ? 'page' : undefined}>
      <Icon size={33} weight="thin" aria-hidden="true" /><span>{label}</span>
    </a>)}
  </nav>;
}

export function HouseHeader({ dossier = false }) {
  return <header className="house-header">
    {!dossier && <a className="back-link" href="#/home"><CaretLeft size={24} weight="light" aria-hidden="true" /> <span>Back</span></a>}
    <a href="#/home" className="house-seal" aria-label="Return to Brindahl"><Artwork asset="seal" priority /></a>
    <p>House Mahgirb<br /><span>of Brindahl</span></p>
  </header>;
}

export function Panel({ title, children, className = '' }) {
  return <section className={`panel ${className}`}><h2><span>{title}</span></h2><div className="panel__body">{children}</div></section>;
}

export function GuestbookLink() {
  return <a className="guestbook-cta bevel" href="#/guestbook">
    <BookOpen size={38} weight="thin" aria-hidden="true" />
    <span>Imperial guestbook<small>{guestbookSubtitle}</small></span>
    <CaretRight size={24} weight="light" aria-hidden="true" />
  </a>;
}

export function DossierLink({ page }) {
  return <a className="dossier-other bevel" href={page === 'duke' ? '#/duchess' : '#/duke'}>{page === 'duke' ? 'Meet the Duchess' : 'Meet the Duke'} <CaretRight size={17} aria-hidden="true" /></a>;
}

export function DossierNavigation({ page }) {
  return <nav className="dossier-navigation" aria-label="House dossiers">
    <div className="dossier-dots">
      {[['home', 'Brindahl'], ['duke', 'Duke Mahgirb'], ['duchess', 'Duchess Lhadnik']].map(([route, label]) => <a key={route} href={`#/${route}`} aria-label={label} aria-current={page === route ? 'page' : undefined}><span /></a>)}
    </div>
  </nav>;
}

export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    previousFocus.current = document.activeElement;
    ref.current.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; previousFocus.current?.focus(); };
  }, []);
  return <dialog ref={ref} className="archive-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="archive-dialog__inner">
      <button className="icon-button dialog-close" type="button" aria-label="Close" onClick={onClose} autoFocus><X size={24} weight="light" /></button>
      <h2 id="dialog-title">{title}</h2>{children}
    </div>
  </dialog>;
}
