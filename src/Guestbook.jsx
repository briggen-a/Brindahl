import React, { useEffect, useRef, useState } from 'react';
import { BottomNav, HouseHeader, Panel } from './components.jsx';
import { registry, preview, preparePhoto } from './registry.js';

import { guestbookSubtitle } from './content.js';

export default function Guestbook() {
  const [entries, setEntries] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState(false);
  const [key, setKey] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [limit, setLimit] = useState(12);
  const locked = useRef(false);
  const attempt = useRef(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () => registry.list(limit).then(rows => { if (active) setEntries(rows); })
      .catch(() => { if (active) setNotice('Could not read the registry. Reconnect and refresh.'); });
    load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [limit, refresh]);

  async function sign(event) {
    event.preventDefault();
    if (locked.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    locked.current = true;
    setBusy(true);
    setNotice('');
    try {
      const name = data.get('name').trim();
      if (!name) throw Error('Please enter a name or signature.');
      if (!attempt.current) {
        const id = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
        attempt.current = { id, name, message: data.get('message').trim(), created: Date.now(), photo: await preparePhoto(data.get('photo')) };
      }
      await registry.sign(attempt.current);
      attempt.current = null;
      form.reset();
      setNotice('Your signature is in the book.');
      setRefresh(n => n + 1);
    } catch (error) { setNotice(error.message); }
    finally { locked.current = false; setBusy(false); }
  }

  async function remove(id) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await registry.remove(id, key);
      setEntries(rows => rows.filter(row => row.id !== id));
      setConfirmId('');
      setRefresh(n => n + 1);
      setNotice('Entry and photo deleted.');
    } catch (error) { setNotice(error.message); }
    finally { locked.current = false; setBusy(false); }
  }

  return <><HouseHeader /><section className="utility-page book">
    <p className="eyebrow">The imperial archives</p><h1 tabIndex={-1}>The imperial<br />visitor registry</h1>
    <p className="page-intro">{guestbookSubtitle}</p>
    {preview && <p className="book-note">Phone preview · signatures are saved in this browser. At the party, everyone shares the book on the Brindahl Wi-Fi.</p>}
    <Panel title="Sign the book"><form onSubmit={sign} onChange={() => { attempt.current = null; }}>
      <fieldset disabled={busy}>
        <label>Your name or signature<input name="name" required maxLength={64} autoComplete="nickname" /></label>
        <label>Message (optional)<textarea name="message" rows={3} maxLength={400} /></label>
        <label>Photo (optional)<input name="photo" type="file" accept="image/*" /></label>
        <p className="book-note">Signing adds your name, time, message and chosen photo to the guestbook for other visitors to see.</p>
        <button className="text-button">{busy ? 'Please wait…' : 'Sign the guestbook'}</button>
      </fieldset>
    </form></Panel>
    <p role="status" className="book-status">{notice}</p>
    <Panel title="Visitor entries">
      {!entries.length && <p>Awaiting the first signature.</p>}
      {entries.map(entry => <article className="book-entry" key={entry.id}>
        <strong>{entry.name}</strong><time dateTime={new Date(entry.created).toISOString()}>{new Date(entry.created).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</time>
        {entry.message && <p>{entry.message}</p>}
        {entry.photo && <img loading="lazy" src={entry.photo} alt={'Guestbook photo from ' + entry.name} />}
        {manage && <button type="button" disabled={busy} className="text-button" onClick={() => confirmId === entry.id ? remove(entry.id) : setConfirmId(entry.id)}>{confirmId === entry.id ? 'Confirm deletion' : 'Delete entry'}</button>}
        {confirmId === entry.id && <button className="text-button" onClick={() => setConfirmId('')}>Cancel</button>}
      </article>)}
      {entries.length >= limit && limit < 200 && <button className="text-button" onClick={() => setLimit(n => Math.min(200,n+12))}>Show earlier signatures</button>}
    </Panel>
    <button className="text-button" onClick={() => {setManage(!manage);setKey('');setConfirmId('');}}>{manage ? 'Close host controls' : 'Host controls'}</button>
    {manage && !preview && <label>Host key<input type="password" value={key} autoComplete="off" onChange={e=>setKey(e.target.value)} /></label>}
  </section><BottomNav page="guestbook" /></>;
}
