import test from 'node:test';
import assert from 'node:assert/strict';
import { guestbookHandler } from '../server/guestbook.js';

function fixture() {
  const rows = new Map();
  const store = {
    ready: () => true,
    list: async limit => [...rows.values()].slice(0, limit),
    read: async id => rows.get(id),
    add: async entry => { if (!rows.has(entry.id)) rows.set(entry.id, entry); },
    remove: async id => { rows.delete(id); },
  };
  const handler = guestbookHandler(store, () => 'a-long-test-password');
  async function call(method, query = '', body, key) {
    const response = {
      code: 200, headers: {},
      setHeader(key, value) { this.headers[key] = value; },
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
      send(body) { this.body = body; },
    };
    await handler({ url: '/api/entries' + query, method, body,
      headers: { 'content-type': 'application/json', 'x-host-key': key } }, response);
    return response;
  }
  return { rows, store, call };
}

const entry = { id: 'a'.repeat(32), name: 'Guest', message: 'Hello', created: 1, photo: '' };

test('two clients see the saved signature; retry preserves original content and server time', async () => {
  const { call } = fixture();
  assert.equal((await call('POST', '', entry)).code, 201);
  assert.equal((await call('POST', '', { ...entry, name: 'Changed' })).code, 201);
  const result = await call('GET');
  assert.equal(result.body.length, 1);
  assert.equal(result.body[0].name, 'Guest');
  assert.ok(result.body[0].created > entry.created);
});

test('host authentication and deletion are enforced independently of UI state', async () => {
  const { call } = fixture();
  await call('POST', '', entry);
  assert.equal((await call('POST', '?action=host', undefined, 'wrong')).code, 403);
  assert.equal((await call('DELETE', '?id=' + entry.id)).code, 403);
  assert.equal((await call('GET')).body.length, 1);
  assert.equal((await call('POST', '?action=host', undefined, 'a-long-test-password')).code, 200);
  assert.equal((await call('DELETE', '?id=' + entry.id, undefined, 'a-long-test-password')).code, 200);
  assert.equal((await call('GET')).body.length, 0);
});

test('rejects invalid IDs, oversized fields, malformed photos and invalid listing limits', async () => {
  const { call } = fixture();
  for (const invalid of [
    { id: '../outside' }, { name: ' ' }, { name: 'a'.repeat(65) },
    { message: 'x'.repeat(401) }, { photo: 'broken' }, { photo: 'a'.repeat(120001) },
  ]) {
    assert.ok((await call('POST', '', { ...entry, ...invalid })).code >= 400);
  }
  assert.equal((await call('GET', '?limit=-1')).code, 400);
  assert.equal((await call('GET', '?photo=../x')).code, 400);
});

test('serves a saved photo separately and removes it with the entry', async () => {
  const { call } = fixture();
  const bytes = Buffer.from([255,216,255,224,0,2,255,217]);
  await call('POST', '', { ...entry, photo: bytes.toString('base64') });
  const rows = (await call('GET')).body;
  assert.equal(rows[0].photo, '/api/entries?photo=' + entry.id);
  assert.deepEqual((await call('GET', '?photo=' + entry.id)).body, bytes);
  await call('DELETE', '?id=' + entry.id, undefined, 'a-long-test-password');
  assert.equal((await call('GET', '?photo=' + entry.id)).code, 404);
});

test('unconfigured storage disables writes and host access', async () => {
  const { call, store, rows } = fixture();
  store.ready = () => false;
  assert.equal((await call('POST', '', entry)).code, 503);
  assert.equal((await call('POST', '?action=host', undefined, 'a-long-test-password')).code, 503);
  assert.equal(rows.size, 0);
});
